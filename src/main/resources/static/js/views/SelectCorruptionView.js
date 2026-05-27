const SelectCorruptionView = {
  html: `
    <div class="card">
        <h2><i class="fas fa-vial"></i> 选择腐化类型 (3/5)</h2>
        <div class="item-list">
            <label><input type="radio" name="corruption" value="1" checked> <i class="fas fa-random"></i> 随机</label>
            <label><input type="radio" name="corruption" value="2"> <i class="fas fa-biohazard"></i> 腐化</label>
            <label><input type="radio" name="corruption" value="3"> <i class="fas fa-tint"></i> 猩红</label>
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
      const selectedValue = document.querySelector('input[name="corruption"]:checked').value;
      postCreatorStep(selectedValue, EnterMapNameView, submitBtn, statusEl);
    });
  }
};