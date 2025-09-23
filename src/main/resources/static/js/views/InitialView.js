const InitialView = {
  html: `
    <div class="card">
      <h2><i class="fas fa-rocket"></i> 创建新的服务器</h2>
      <p>欢迎使用 tModLoader 服务器管理面板！点击下方按钮开始创建新的服务器。</p>
      <div style="text-align: center; margin: 30px 0;">
        <button id="startCreateBtn" style="padding: 15px 40px; font-size: 18px;">
          <i class="fas fa-play"></i> 开始创建
        </button>
      </div>
      <div style="background: rgba(67, 97, 238, 0.1); border-radius: 10px; padding: 20px; margin-top: 20px;">
        <h3><i class="fas fa-info-circle"></i> 提示</h3>
        <p>在创建服务器之前，请确保您已经准备好了需要的模组文件和世界文件。</p>
      </div>
    </div>
  `,
  init: () => {
    document.getElementById('startCreateBtn').addEventListener('click', () => {
      serverConfig = {};
      loadView(SelectModView);
    });
  }
};