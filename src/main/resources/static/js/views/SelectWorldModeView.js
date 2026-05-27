const SelectWorldModeView = {
  html: `
    <div class="card">
        <h2><i class="fas fa-gamepad"></i> 选择模式 (2/5)</h2>
        <div class="item-list">
            <label><input type="radio" name="worldMode" value="1" checked> <i class="fas fa-leaf"></i> 经典</label>
            <label><input type="radio" name="worldMode" value="2"> <i class="fas fa-skull-crossbones"></i> 专家</label>
            <label><input type="radio" name="worldMode" value="3"> <i class="fas fa-crown"></i> 大师</label>
            <label><input type="radio" name="worldMode" value="4"> <i class="fas fa-feather-alt"></i> 旅行</label>
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
      const selectedValue = document.querySelector('input[name="worldMode"]:checked').value;
      postCreatorStep(selectedValue, SelectCorruptionView, submitBtn, statusEl);
    });
  }
};