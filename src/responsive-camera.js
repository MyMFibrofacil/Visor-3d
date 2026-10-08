// Maintain horizontal framing in portrait viewports, preserving the user's zoom.
export function responsiveCamera(camera, controls, canvas, referenceAspect = 1.5) {
  let previousFactor = 1;
  controls.minDistance = 2;
  controls.maxDistance = 100;
  camera.far = 200;
  function resize(reset = false) {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    const factor = Math.max(1, referenceAspect * height / width);
    if (reset) previousFactor = 1;
    camera.position.sub(controls.target).multiplyScalar(factor / previousFactor).add(controls.target);
    previousFactor = factor;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  return { resize };
}
