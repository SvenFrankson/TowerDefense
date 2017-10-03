class Main {

    public static instance: Main;
    public canvas: HTMLCanvasElement;
    public engine: BABYLON.Engine;
    public scene: BABYLON.Scene;
    public light1: BABYLON.Light;
    public light2: BABYLON.Light;
    public camera: BABYLON.Camera;

    constructor(canvasElement: string) {
        Main.instance = this;
        this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.engine.enableOfflineSupport = false;
        BABYLON.Engine.ShadersRepository = "./shaders/";
    }

    createScene(): void {
        this.scene = new BABYLON.Scene(this.engine);
        this.resize();

        let pointLight1: BABYLON.PointLight = new BABYLON.PointLight("Light", new BABYLON.Vector3(5, 20, 5), this.scene);
        pointLight1.intensity = 0.7;
        this.light1 = pointLight1;
        let pointLight2: BABYLON.PointLight = new BABYLON.PointLight("Light", new BABYLON.Vector3(-5, 20, 5), this.scene);
        pointLight2.intensity = 0.7;
        this.light2 = pointLight2;

        // let arcCamera: BABYLON.ArcRotateCamera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 1, new BABYLON.Vector3(12.5, 0, 12.5), this.scene);
        // arcCamera.setPosition(new BABYLON.Vector3(-8, 5, 8));
        // arcCamera.attachControl(this.canvas);

        let freeCamera: BABYLON.FreeCamera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 10, 0), this.scene);
        freeCamera.setTarget(new BABYLON.Vector3(10, 0, 10));
        freeCamera.attachControl(this.canvas);
        this.camera = freeCamera;

        let game: Game = new Game(this.scene);
        game.AddNewPlayer("Sven", true);

        new UserInterface(game);
    }

    public animate(): void {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        window.addEventListener("resize", () => {
            this.resize();
        });
    }

    public resize(): void {
        this.engine.resize();
    }
}

window.addEventListener("DOMContentLoaded", () => {
    let game: Main = new Main("render-canvas");
    game.createScene();
    game.animate();
});
