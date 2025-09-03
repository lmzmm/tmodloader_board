const InitialView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-rocket"></i> 创建新的服务器</h2>
      <button id="startCreateBtn"><i class="fas fa-play"></i> 开始创建</button>
    </div>
  `,
  init: () => {
    document.getElementById('startCreateBtn').addEventListener('click', () => {
      serverConfig = {};
      loadView(SelectModView);
    });
  }
};