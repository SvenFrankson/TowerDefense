interface ISpawn {
    n: string;
    t: number;
}

class Spawn {
    
    constructor(
        public n: string,
        public t: number
    ) {

    }
}

class Spawner extends Building {

    private spawns: ISpawn[];
    
    constructor(
        spawns: ISpawn[],
        tile: Tile
    ) {
        super("Spawner", tile);
        this.hitpoint = 42000;
        this.spawns = spawns;
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
        while (this.spawns.length > 0 && this._kSpawn > this.spawns[0].t) {
            let spawn: Spawn = this.spawns.splice(0, 1)[0];
            if (spawn.n === "d") {
                let creep: Creep = new Drone(this.game);
                creep.load();
                creep.position.copyFrom(this.position)
            }
        }
    }

    public buildingType(): BuildingType {
        return BuildingType.Spawner;
    }
}