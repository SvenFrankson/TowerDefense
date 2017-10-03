class Drone extends Creep {

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
                meshes.forEach(
                    (m: BABYLON.AbstractMesh) => {
                        if (m instanceof BABYLON.Mesh) {
                            m.parent = this;
                            m.rotation.copyFromFloats(0, 0, 0);
                            let droneMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("DroneMaterial", this.getScene());
                            droneMaterial.diffuseTexture = new BABYLON.Texture("./data/drone-diffuse.png", this.getScene());
                            droneMaterial.specularColor.copyFromFloats(0.2, 0.2, 0.2);
                            m.material = droneMaterial;
                        }
                    }
                );
                this._isLoaded = true;
            }
        );
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
    }
}