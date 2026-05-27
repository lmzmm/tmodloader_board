function setupUploader(options) {
  const {
    dropZoneId, fileInputId, fileListId, uploadBtnId, showUploaderBtnId,
    uploaderAreaId, uploadEndpoint, onUploadComplete, statusContainerId
  } = options;

  const dropZone = document.getElementById(dropZoneId);
  const fileInput = document.getElementById(fileInputId);
  const fileListContainer = document.getElementById(fileListId);
  const uploadBtn = document.getElementById(uploadBtnId);
  const uploaderArea = document.getElementById(uploaderAreaId);
  const statusContainer = document.getElementById(statusContainerId);

  // 允许 showUploaderBtn 不存在
  const showUploaderBtn = showUploaderBtnId ? document.getElementById(showUploaderBtnId) : null;

  if (!dropZone || !fileInput || !uploadBtn) {
      console.error(`[Uploader Error] 缺少关键元素`);
      return;
  }

  let filesToUpload = [];

  const updateFileList = () => {
    fileListContainer.innerHTML = '';
    if (filesToUpload.length === 0) {
      fileListContainer.innerHTML = '<p style="color: #999; font-size: 0.9em;">暂无文件</p>';
      return;
    }
    filesToUpload.forEach((file, index) => {
      const fileElement = document.createElement('div');
      fileElement.style.cssText = "display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid #eee;";
      fileElement.innerHTML = `
        <span>${file.name}</span>
        <span class="del-btn" style="color:red; cursor:pointer;" data-idx="${index}">×</span>
      `;
      fileListContainer.appendChild(fileElement);
    });

    fileListContainer.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(e.target.getAttribute('data-idx'));
            filesToUpload.splice(idx, 1);
            updateFileList();
        });
    });
  };

  const handleFiles = (files) => {
    if(!files || files.length === 0) return;
    filesToUpload.push(...Array.from(files));
    updateFileList();
  };

  // --- 修复点击两次的问题 ---
  if (showUploaderBtn && uploaderArea) {
      showUploaderBtn.addEventListener('click', (e) => {
          e.preventDefault();
          // 获取计算后的样式，确保第一次点击也能正确识别状态
          const currentDisplay = window.getComputedStyle(uploaderArea).display;
          const isHidden = currentDisplay === 'none';
          uploaderArea.style.display = isHidden ? 'block' : 'none';
      });
  }

  // --- 修复弹出两次文件选择的问题 ---
  // 使用 onclick 赋值而不是 addEventListener，防止外部重复绑定时的叠加（虽然我们在main.js里删了，但这更加保险）
  dropZone.onclick = () => {
      fileInput.click();
  };

  fileInput.onchange = () => {
      handleFiles(fileInput.files);
      fileInput.value = '';
  };

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); });
  });

  ['dragenter', 'dragover'].forEach(eventName => dropZone.addEventListener(eventName, () => {
      dropZone.style.background = '#e3f2fd';
  }));

  ['dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, () => {
      dropZone.style.background = '';
  }));

  dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));

  uploadBtn.addEventListener('click', async () => {
    if (filesToUpload.length === 0) {
      alert('请先选择或拖拽文件！');
      return;
    }

    uploadBtn.disabled = true;
    const originBtnText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 上传中...';
    statusContainer.innerHTML = '';

    const uploadPromises = [];

    for (const file of filesToUpload) {
      const formData = new FormData();
      formData.append('file', file);

      const promise = authFetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      })
      .then(response => {
        if (!response.ok) return response.text().then(text => Promise.reject(text));
        return response.text();
      })
      .then(text => {
        statusContainer.innerHTML += `<div class="status-success" style="color:green; font-size:0.9em;">✅ ${file.name} - 成功</div>`;
      })
      .catch(err => {
        statusContainer.innerHTML += `<div class="status-fail" style="color:red; font-size:0.9em;">❌ ${file.name} - 失败</div>`;
      });
      uploadPromises.push(promise);
    }

    await Promise.allSettled(uploadPromises);

    uploadBtn.disabled = false;
    uploadBtn.innerHTML = originBtnText;
    filesToUpload = [];
    updateFileList();

    if (typeof onUploadComplete === 'function') {
      onUploadComplete();
    }
  });

  updateFileList();
}