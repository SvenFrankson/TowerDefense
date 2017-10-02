class Wall extends Building {

    public body: BABYLON.AbstractMesh;

    constructor(
        tile: Tile
    ) {
        super("Wall", tile);
        this.hitpoint = 60;
    }

    public load(): void {
        BABYLON.SceneLoader.ImportMesh(
            "",
            "./data/wall.babylon",
            "",
            this.getScene(),
            (
                meshes, particleSystems, skeletons
            ) => {
                meshes.forEach(
                    (m: BABYLON.AbstractMesh) => {
                        if (m instanceof BABYLON.Mesh) {
                            if (m.name === "Body") {
                                this.body = m;
                                this.body.parent = this;
                            }
                        }
                    }
                );
                if (!this.body) {
                    return console.error("Failed to load some part of 'Wall'.");
                }
                this.body.parent = this;
            }
        );
    }

    public update(): void {
        
    }

    public buildingType(): BuildingType {
        return BuildingType.Wall;
    }
}