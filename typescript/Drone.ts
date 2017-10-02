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