package com.tModLoader_Board.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Order(1)
public class PasswordFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(PasswordFilter.class);

    @Value("${app.password:}")
    private String password;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();

        if (path.equals("/") || path.equals("/index.html") || path.equals("/login.html") ||
                path.startsWith("/css/") || path.startsWith("/js/") ||
                path.equals("/favicon.ico") || path.startsWith("/fonts/")) {
            chain.doFilter(request, response);
            return;
        }

        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        if (password == null || password.isEmpty()) {
            chain.doFilter(request, response);
            return;
        }

        String requestPassword = httpRequest.getHeader("X-Password");
        if (requestPassword == null) {
            requestPassword = httpRequest.getParameter("password");
        }

        if (!password.equals(requestPassword)) {
            String acceptHeader = httpRequest.getHeader("Accept");
            if (acceptHeader != null && acceptHeader.contains("text/html")) {
                httpResponse.sendRedirect("/login.html?redirect=" +
                        java.net.URLEncoder.encode(path, "UTF-8"));
            } else {
                httpResponse.setStatus(401);
                httpResponse.setContentType("text/plain; charset=UTF-8");
                httpResponse.getWriter().write("密码错误或未提供密码");
            }
            return;
        }

        chain.doFilter(request, response);
    }
}