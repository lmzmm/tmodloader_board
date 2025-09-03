function setupUploader(options) {
  const {
    dropZoneId, fileInputId, fileListId, uploadBtnId, showUploaderBtnId,
    uploaderAreaId, uploadEndpoint, onUploadComplete, statusContainerId
  } = options;

  const dropZone = document.getElementById(dropZoneId);
  const fileInput = document.getElementById(fileInputId);
  const fileListContainer = document.getElementById(fileListId);
  const uploadBtn = document.getElementById(uploadBtnId);
  const showUploaderBtn = document.getElementById(showUploaderBtnId);
  const uploaderArea = document.getElementById(uploaderAreaId);
  const statusContainer = document.getElementById(statusContainerId);

  let filesToUpload = [];

  const updateFileList = () => {
    fileListContainer.innerHTML = '';
    if (filesToUpload.length === 0) {
      fileListContainer.innerHTML = '<p>暂无文件</p>';
      return;
    }
    filesToUpload.forEach(file => {
      const fileElement = document.createElement('div');
      fileElement.textContent = file.name;
      fileListContainer.appendChild(fileElement);
    });
  };

  const handleFiles = (files) => {
    filesToUpload.push(...Array.from(files));
    updateFileList();
  };

  showUploaderBtn.addEventListener('click', () => uploaderArea.classList.toggle('visible'));
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFiles(fileInput.files));
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); });
  });
  ['dragenter', 'dragover'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover')));
  ['dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover')));
  dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));

  uploadBtn.addEventListener('click', async () => {
    if (filesToUpload.length === 0) {
      alert('请先选择或拖拽文件！');
      return;
    }

    uploadBtn.disabled = true;
    statusContainer.innerHTML = '正在准备上传...';
    const uploadPromises = [];

    for (const file of filesToUpload) {
      const formData = new FormData();
      formData.append('file', file);

      const promise = fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => Promise.reject(`服务器错误: ${text}`));
        }
        return response.text();
      })
      .then(text => {
        if (text.trim() === 'OK') {
           statusContainer.innerHTML += `<div class="status-success">✅ ${file.name} - 上传成功!</div>`;
        } else {
           return Promise.reject(`未知响应: ${text}`);
        }
      })
      .catch(err => {
        statusContainer.innerHTML += `<div class="status-fail">❌ ${file.name} - 上传失败: ${err}</div>`;
      });
      uploadPromises.push(promise);
    }

    await Promise.allSettled(uploadPromises);

    statusContainer.innerHTML += '<p>所有任务已完成。</p>';
    uploadBtn.disabled = false;
    filesToUpload = [];
    updateFileList();

    if (typeof onUploadComplete === 'function') {
      onUploadComplete();
    }
  });

  updateFileList();
}