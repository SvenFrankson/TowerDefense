class Tile {

    public selected: boolean = false;
    public name: string;
    public x: number;
    public z: number;
    public buildable: boolean = false;
    public terrain: Terrain;
    public get scene(): BABYLON.Scene {
        return this.terrain.scene;
    }
    public get game(): Game {
        return this.terrain.game;
    }
    public building: Building;
    private _heatMap: number[][];
    public get heatMap(): number[][] {
        if (!this._heatMap) {
            this.refreshHeatMap();
        }
        return this._heatMap;
    }
    public get hasHeatMap(): boolean {
        return this._heatMap !== undefined;
    }

    constructor(x: number, z: number, terrain: Terrain) {
        this.name = "x" + x + "z" + z;
        this.x = x;
        this.z = z;
        this.terrain = terrain;
    }

    public deserialize(data: TileData): void {
        this.buildable = data.buildable;
        if (data.building) {
            if (data.building.type === BuildingType.Spawner) {
                this.building = new Spawner(data.building.spawns, this);
                this.building.load();
            } else if (data.building.type === BuildingType.Props) {
                this.building = new Props(data.building.name, data.building.orientation, this);
                this.building.load();
            }
        }
    }

    public createTower(): boolean {
        if (this.building) {
            return false; // tile already has tower
        }
        this.building = new Tower(this);
        this.building.load();
        this.terrain.refreshHeatMaps();
        return true;
    }

    public createGatling(): boolean {
        if (this.building) {
            return false; // tile already has tower
        }
        this.building = new Gatling(this);
        this.building.load();
        this.terrain.refreshHeatMaps();
        return true;
    }

    public createWall(): boolean {
        if (this.building) {
            return false; // tile already has tower
        }
        this.building = new Wall(this);
        this.building.load();
        this.terrain.refreshHeatMaps();
        return true;
    }

    public refreshHeatMap(): void {
        this._heatMap = [];
        for (let i: number = 0; i < this.terrain.width; i++) {
            this._heatMap[i] = [];
            for (let j: number = 0; j < this.terrain.height; j++) {
                this._heatMap[i][j] = Infinity;
            }
        }
        this._heatMap[this.x][this.z] = 0;
        let updated: BABYLON.Vector2[] = [new BABYLON.Vector2(this.x, this.z)];
        while (updated.length > 0) {
            updated = this.stepUpdateHeatMap(updated);
        }
        this.clearBuildingHeatMap();
    }

    private stepUpdateHeatMap(current: BABYLON.Vector2[]): BABYLON.Vector2[] {
        let updated: BABYLON.Vector2[] = [];
        current.forEach(
            (c: BABYLON.Vector2) => {
                let i: number = c.x;
                let j: number = c.y;
                let heat: number = this._heatMap[i][j];
                if (this.terrain.tile(i - 1, j)) {
                    let threshold: number = heat + 1;
                    if (this.terrain.tile(i - 1, j).building) {
                        threshold += this.terrain.tile(i - 1, j).building.hitpoint;
                    }
                    if (this._heatMap[i - 1][j] > threshold) {
                        this._heatMap[i - 1][j] = threshold;
                        updated.push(new BABYLON.Vector2(i - 1, j));
                    }
                }
                if (this.terrain.tile(i + 1, j)) {
                    let threshold: number = heat + 1;
                    if (this.terrain.tile(i + 1, j).building) {
                        threshold += this.terrain.tile(i + 1, j).building.hitpoint;
                    }
                    if (this._heatMap[i + 1][j] > threshold) {
                        this._heatMap[i + 1][j] = threshold;
                        updated.push(new BABYLON.Vector2(i + 1, j));
                    }
                }
                if (this.terrain.tile(i, j - 1)) {
                    let threshold: number = heat + 1;
                    if (this.terrain.tile(i, j - 1).building) {
                        threshold += this.terrain.tile(i, j - 1).building.hitpoint;
                    }
                    if (this._heatMap[i][j - 1] > threshold) {
                        this._heatMap[i][j - 1] = threshold;
                        updated.push(new BABYLON.Vector2(i, j - 1));
                    }
                }
                if (this.terrain.tile(i, j + 1)) {
                    let threshold: number = heat + 1;
                    if (this.terrain.tile(i, j + 1).building) {
                        threshold += this.terrain.tile(i, j + 1).building.hitpoint;
                    }
                    if (this._heatMap[i][j + 1] > threshold) {
                        this._heatMap[i][j + 1] = threshold;
                        updated.push(new BABYLON.Vector2(i, j + 1));
                    }
                }
            }
        )
        return updated;
    }

    private clearBuildingHeatMap(): void {
        for (let i: number = 0; i < this.terrain.width; i++) {
            for (let j: number = 0; j < this.terrain.height; j++) {
                if (this.terrain.tile(i, j).building) {
                    this._heatMap[i][j] = Infinity;
                }
            }
        }
    }

    public heat(i: number, j: number): number {
        if (this.heatMap[i] && this.heatMap[i][j]) {
            return this.heatMap[i][j];
        }
        return Infinity;
    }

    public heatsFor(i: number, j: number): number[][] {
        let heats: number[][] = [];
        for (let ii: number = -1; ii <= 1; ii++) {
            heats[ii + 1] = [];
            for (let jj: number = -1; jj <= 1; jj++) {
                heats[ii + 1][jj + 1] = this.heat(i + ii, j + jj);
            }
        }
        return heats;
    }

    public serialize(): TileData {
        let data: TileData = new TileData();
        data.buildable = this.buildable;
        if (this.building) {
            data.building.type = this.building.buildingType();
            data.building.name = this.building.name;
        }
        return data;
    }
}