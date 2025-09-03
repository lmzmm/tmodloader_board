const FinalizeWorldView = {
  html: `
    <div class="card">
        <h2><i class="fas fa-seedling"></i> 输入地图种子 (5/5)</h2>
        <div class="form-group">
            <label for="mapSeed">地图种子 (可选)</label>
            <input type="text" id="mapSeed" placeholder="留空则为随机种子">
        </div>
        <button id="createWorldBtn"><i class="fas fa-check"></i> 创建地图</button>
        <div id="stepStatus" class="step-status"></div>
    </div>
  `,
  init: () => {
    const createBtn = document.getElementById('createWorldBtn');
    const statusEl = document.getElementById('stepStatus');
    const seedInput = document.getElementById('mapSeed');

    createBtn.addEventListener('click', () => {
      const mapSeed = seedInput.value.trim();

      // 调用辅助函数，但 nextView 设为 null，表示这是最后一步
      postCreatorStep(mapSeed, null, createBtn, statusEl, '世界创建流程已完成！');
    });
  }
};