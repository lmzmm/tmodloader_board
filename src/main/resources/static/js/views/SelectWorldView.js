const SelectWorldView = {
    html: `
    <div class="card">
      <h2><i class="fas fa-globe-americas"></i> 选择世界</h2>
      <p>请选择一个现有的世界或上传新的世界文件。</p>
      <div class="content-wrapper">
        <div class="selection-area">
          <div id="worldListContainer">正在加载世界列表...</div><br>
          <button id="showWorldUploaderBtn" style="width: 100%;">
            <i class="fas fa-upload"></i> 上传新世界
          </button>
        </div>
        <div id="worldUploadArea" class="upload-area">
          <h3><i class="fas fa-upload"></i> 上传世界文件</h3>
          <div id="worldDropZone" class="drop-zone">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>拖动文件到此处，或点击选择</p>
            <p style="font-size: 0.9em; margin-top: 10px;">支持 .wld 文件</p>
          </div>
          <input type="file" id="worldFileInput" multiple style="display: none;">
          <h4><i class="fas fa-list"></i> 待上传列表：</h4>
          <div id="worldFileList" class="file-list-container"></div>
          <div id="worldUploadStatus"></div>
          <br>
          <button id="uploadAllWorldsBtn" style="width: 100%;">
            <i class="fas fa-arrow-up"></i> 开始上传
          </button>
        </div>
      </div>
    </div>`,
  init: function() {
    this.renderWorldList();
    setupUploader({
      dropZoneId: 'worldDropZone', fileInputId: 'worldFileInput', fileListId: 'worldFileList',
      uploadBtnId: 'uploadAllWorldsBtn', showUploaderBtnId: 'showWorldUploaderBtn',
      uploaderAreaId: 'worldUploadArea', uploadEndpoint: '/create/uploadworld',
      statusContainerId: 'worldUploadStatus',
      onUploadComplete: this.renderWorldList
    });
  },
  renderWorldList: function() {
    const container = document.getElementById('worldListContainer');
    container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 正在刷新世界列表...</p>';
    fetch('/create/worldlist')
      .then(response => {
        if (!response.ok) return ['默认世界', '超平坦世界', '空岛世界']; // Mock data
        return response.json();
      })
      .then(worlds => {
        let listHtml = `<h3><i class="fas fa-globe"></i> 可用世界</h3><div class="item-list">`;
        worlds.forEach((world, index) => {
          const isChecked = serverConfig.world === world ? 'checked' : (index === 0 && !serverConfig.world ? 'checked' : '');
          listHtml += `<label><input type="radio" name="world" value="${world}" ${isChecked}> ${world}</label>`;
        });
        listHtml += `</div><br>
          <button id="submitWorldBtn" style="width: 100%;">
            <i class="fas fa-arrow-right"></i> 下一步
          </button>`;
        container.innerHTML = listHtml;
        document.getElementById('submitWorldBtn').addEventListener('click', () => {
          const selected = document.querySelector('input[name="world"]:checked');
          if (!selected) { alert('请选择一个世界！'); return; }
          serverConfig.world = selected.value;
          alert(`世界 "${serverConfig.world}" 选择成功!`);
          loadView(ServerSettingsView);
        });
      })
      .catch(err => { 
        container.innerHTML = '<p style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> 加载世界列表失败: ' + err.message + '</p>'; 
      });
  }
};