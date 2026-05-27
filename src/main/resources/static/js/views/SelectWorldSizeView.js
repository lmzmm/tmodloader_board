const SelectWorldSizeView = {
  html: `
    <div class="card">
        <h2><i class="fas fa-ruler-combined"></i> 选择世界大小 (1/5)</h2>
        <div class="item-list">
            <label><input type="radio" name="worldSize" value="1" checked> <i class="fas fa-compress-arrows-alt"></i> 小</label>
            <label><input type="radio" name="worldSize" value="2"> <i class="fas fa-arrows-alt-h"></i> 中</label>
            <label><input type="radio" name="worldSize" value="3"> <i class="fas fa-expand-arrows-alt"></i> 大</label>
        </div>
        <br>
        <button id="submitBtn" class="btn-primary">下一步 <i class="fas fa-arrow-right"></i></button>
        <div id="stepStatus" class="step-status"></div>
    </div>
  `,
  init: () => {
    const submitBtn = document.getElementById('submitBtn');
    const statusEl = document.getElementById('stepStatus');

    submitBtn.addEventListener('click', () => {
      const selectedValue = document.querySelector('input[name="worldSize"]:checked').value;
      postCreatorStep(selectedValue, SelectWorldModeView, submitBtn, statusEl);
    });
  }
};