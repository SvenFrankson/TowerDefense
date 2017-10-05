class Drone extends Creep {

    public body: BABYLON.AbstractMesh;
    public head: BABYLON.AbstractMesh;
    public ringTop: BABYLON.AbstractMesh;
    public ringBottom: BABYLON.AbstractMesh;

    constructor(game: Game) {
        super("drone", game);
    }

    public load(): void {
        BABYLON.SceneLoader.ImportMesh(
            "",
            "./data/" + this.name + ".babylon",
            "",
            this.getScene(),
            (
                meshes, particleSystems, skeletons
            ) => {
                let droneMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("DroneMaterial", this.getScene());
                droneMaterial.diffuseColor.copyFromFloats(0.5, 0.5, 0.5);
                droneMaterial.diffuseTexture = new BABYLON.Texture("./data/drone-diffuse.png", this.getScene());
                droneMaterial.specularColor.copyFromFloats(0.2, 0.2, 0.2);

                meshes.forEach(
                    (m: BABYLON.AbstractMesh) => {
                        if (m instanceof BABYLON.Mesh) {
                            if (m.name === "Body") {
                                this.body = m;
                                this.body.parent = this;
                                this.body.material = droneMaterial;
                            }
                            if (m.name === "Head") {
                                this.head = m;
                                this.head.parent = this;
                                this.head.material = droneMaterial;
                            }
                            if (m.name === "RingTop") {
                                this.ringTop = m;
                                this.ringTop.parent = this;
                                this.ringTop.material = droneMaterial;
                            }
                            if (m.name === "RingBottom") {
                                this.ringBottom = m;
                                this.ringBottom.parent = this;
                                this.ringBottom.material = droneMaterial;
                            }
                        }
                    }
                );
                if (!this.body || !this.head || !this.ringTop || !this.ringBottom) {
                    return console.error("Failed to load some part of 'Drone'.");
                }
                this.body.parent = this;
                this.head.parent = this;
                this.ringTop.parent = this;
                this.ringBottom.parent = this;
                this.getScene().registerBeforeRender(this.animate);
                this._isLoaded = true;
            }
        );
    }

    private _kAnim: number = 0;
    private animate = () => {
        this.ringTop.rotation.y += 0.02;
        this.ringTop.position.y = 0.1 * Math.cos(this._kAnim / 60);
        this.ringBottom.rotation.y -= 0.01;
        this.ringBottom.position.y = - 0.1 * Math.cos(this._kAnim / 30);
    }
    
    public kill(): void {
        let children: BABYLON.Node[] = this.getChildren();
        children.forEach(
            (n: BABYLON.Node) => {
                if (n instanceof BABYLON.AbstractMesh) {
                    n.dispose();
                }
            }
        )
        let index: number = Creep.instances.indexOf(this);
        if (index !== -1) {
            Creep.instances.splice(index, 1);
        }
        this.getScene().unregisterBeforeRender(this.update);
        this.getScene().unregisterBeforeRender(this.animate);
    }
}