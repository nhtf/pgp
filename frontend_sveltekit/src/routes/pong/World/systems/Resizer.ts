
class Resizer {
    constructor(container, camera, renderer) {

        this.setSize(container, camera, renderer);
    }

    setSize(container, camera, renderer) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
      
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        this.onResize();
      }

    onResize() {}
}

export { Resizer };