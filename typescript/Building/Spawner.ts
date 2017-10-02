class Spawner extends Building {
    
    constructor(
        tile: Tile
    ) {
        super("Spawner", tile);
        this.hitpoint = 42000;
    }

    public load(): void {
        this._isLoaded = true;
        BABYLON.SceneLoader.ImportMesh(
            "",
            "./data/spawner.babylon",
            "",
            this.getScene(),
            (
                meshes, particleSystems, skeletons
            ) => {
                
            }
        );
    }

    public update(): void {
        if (this._isLoaded) {
            this.spawn();
        }
    }

    private _kSpawn: number = 0;
    public spawn(): void {
        this._kSpawn ++;
        if (this._kSpawn > 300) {
            let creep: Creep = new Drone(this.game);
            creep.load();
            creep.position.copyFrom(this.position)
            this._kSpawn = 0;
        }
    }

    public buildingType(): BuildingType {
        return BuildingType.Spawner;
    }
}