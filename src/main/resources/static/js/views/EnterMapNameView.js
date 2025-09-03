const EnterMapNameView = {
  html: `
    <div class="card">
        <h2><i class="fas fa-signature"></i> 输入地图名称 (4/5)</h2>
        <div class="form-group">
            <label for="mapName">地图名称 (必填)</label>
            <input type="text" id="mapName" placeholder="例如: 我的冒险世界">
        </div>
        <button id="submitBtn">下一步 <i class="fas fa-arrow-right"></i></button>
        <div id="stepStatus" class="step-status"></div>
    </div>
  `,
  init: () => {
    const submitBtn = document.getElementById('submitBtn');
    const statusEl = document.getElementById('stepStatus');
    const nameInput = document.getElementById('mapName');

    submitBtn.addEventListener('click', () => {
      const mapName = nameInput.value.trim();
      if (!mapName) {
        alert('地图名称不能为空！');
        return;
      }
      postCreatorStep(mapName, FinalizeWorldView, submitBtn, statusEl);
    });
  }
};