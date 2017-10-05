class Props extends Building {
    
    constructor(
        name: string,
        orientation: number,
        tile: Tile
    ) {
        super(name, tile);
        this.hitpoint = Infinity;
        this.rotation.y = orientation * Math.PI / 2;
        this.getScene().unregisterBeforeRender(this.updateCallback);
    }

    public load(): void {
        this._isLoaded = true;
        BABYLON.SceneLoader.ImportMesh(
            "",
            "./data/" + this.name + ".babylon",
            "",
            this.getScene(),
            (
                meshes, particleSystems, skeletons
            ) => {
                for (let i: number = 0; i < meshes.length; i++) {
                    meshes[i].parent = this;
                }
            }
        );
    }

    public buildingType(): BuildingType {
        return BuildingType.Props;
    }
}