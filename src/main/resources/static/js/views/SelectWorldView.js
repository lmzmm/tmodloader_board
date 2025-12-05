const SelectWorldView = {
    html: `
    <div class="card">
      <h2><i class="fas fa-globe-americas"></i> 选择世界</h2>
      <p>请选择一个现有的世界或上传新的世界文件。</p>
      
      <div class="content-wrapper">
        <!-- 1. 世界列表 -->
        <div class="selection-area">
          <div id="worldListContainer" style="max-height: 250px; overflow-y: auto; border: 1px solid #eee; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
            正在加载世界列表...
          </div>
        </div>

        <!-- 2. 上传/刷新区域 (放在下一步按钮上面) -->
        <div style="margin-bottom: 25px;">
            <div style="display:flex; gap:10px;">
                <button id="showWorldUploaderBtn" style="flex:1; background:#f8f9fa; color:#495057; border:1px solid #ced4da;">
                    <i class="fas fa-upload"></i> 上传新世界
                </button>
                <button id="refreshWorldListBtn" style="flex:0 0 auto; background:#f8f9fa; color:#495057; border:1px solid #ced4da;">
                    <i class="fas fa-sync-alt"></i>
                </button>
            </div>
            
            <!-- 上传区域 (默认隐藏) -->
            <div id="worldUploadArea" class="upload-area" style="display: none; margin-top: 15px; padding: 15px; border: 1px dashed #4361ee; background: #f8f9ff; border-radius: 8px;">
              <h3 style="margin-top:0; color:#4361ee; font-size:1em;"><i class="fas fa-cloud-upload-alt"></i> 上传 .wld 文件</h3>
              <div id="worldDropZone" class="drop-zone" style="background:#fff; border:1px solid #dee2e6; padding:15px; text-align:center; cursor:pointer;">
                <i class="fas fa-file-import" style="font-size:1.5em; color:#adb5bd;"></i>
                <p style="margin:5px 0 0; font-size:0.9em; color:#666;">点击或拖拽文件</p>
              </div>
              <input type="file" id="worldFileInput" multiple style="display: none;">
              
              <div id="worldFileList" class="file-list-container" style="margin-top:10px;"></div>
              <div id="worldUploadStatus" style="font-size:0.9em; margin-top:5px;"></div>
              
              <button id="uploadAllWorldsBtn" style="width: 100%; margin-top: 10px; background: #4361ee; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">
                <i class="fas fa-arrow-up"></i> 开始上传
              </button>
            </div>
        </div>
        
        <!-- 3. 下一步按钮 (固定在底部) -->
        <button id="submitWorldBtn" style="width: 100%; padding: 12px; font-size: 1.1em; background-color: #4361ee; color: white; border: none; border-radius: 6px; cursor: pointer;">
            <i class="fas fa-arrow-right"></i> 下一步
        </button>
      </div>
    </div>`,

  init: function() {
    this.renderWorldList();

    // 初始化上传组件
    setupUploader({
      dropZoneId: 'worldDropZone',
      fileInputId: 'worldFileInput',
      fileListId: 'worldFileList',
      uploadBtnId: 'uploadAllWorldsBtn',
      showUploaderBtnId: 'showWorldUploaderBtn', // 这里复用了 showUploaderBtnId 逻辑，或者使用下面的 toggle 逻辑
      uploaderAreaId: 'worldUploadArea',
      uploadEndpoint: '/resource/uploadworld',
      statusContainerId: 'worldUploadStatus',
      onUploadComplete: () => {
          this.renderWorldList();
          // 延迟隐藏上传区域（可选）
          // document.getElementById('worldUploadArea').style.display = 'none';
      }
    });

    // 绑定刷新按钮
    document.getElementById('refreshWorldListBtn').addEventListener('click', () => this.renderWorldList());

    // 绑定下一步按钮 (静态绑定)
    document.getElementById('submitWorldBtn').addEventListener('click', () => {
      const selected = document.querySelector('input[name="world"]:checked');
      if (!selected) {
          alert('请先选择一个世界！');
          return;
      }
      serverConfig.world = selected.value;
      alert(`世界 "${serverConfig.world}" 选择成功!`);
      loadView(ServerSettingsView);
    });
  },

  renderWorldList: function() {
    const container = document.getElementById('worldListContainer');
    container.innerHTML = '<p style="text-align:center; color:#888;"><i class="fas fa-spinner fa-spin"></i> 正在刷新世界列表...</p>';

    fetch('/resource/worldlist')
      .then(response => {
        if (!response.ok) throw new Error("无法加载世界列表");
        return response.json();
      })
      .then(worlds => {
        if (!worlds || worlds.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#888;">暂无世界文件，请上传。</p>';
            return;
        }

        let listHtml = `<div class="item-list">`;
        worlds.forEach((world, index) => {
          // 默认选中第一个，或者是之前选中的
          const isChecked = serverConfig.world === world ? 'checked' : (index === 0 && !serverConfig.world ? 'checked' : '');
          listHtml += `
          <label style="display:flex; align-items:center; padding:10px; border-bottom:1px solid #f1f1f1; cursor:pointer;">
            <input type="radio" name="world" value="${world}" ${isChecked} style="margin-right:10px;"> 
            <i class="fas fa-globe" style="color:#adb5bd; margin-right:8px;"></i>
            ${world}
          </label>`;
        });
        listHtml += `</div>`;
        container.innerHTML = listHtml;
      })
      .catch(err => {
        container.innerHTML = `<p style="color: red; text-align:center;">加载失败: ${err.message}</p>`;
      });
  }
};