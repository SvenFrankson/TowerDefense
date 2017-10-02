class Terrain {

    public game: Game;
    
    public get scene(): BABYLON.Scene {
        return this.game.scene;
    }

    public mesh: BABYLON.Mesh;

    public tiles: Tile[][];
    public get width(): number {
        return this.tiles.length;
    }
    public get height(): number {
        return this.tiles[0].length;
    }

    constructor(game: Game) {
        this.game = game;
        this.load(
            TerrainData.Test(),
            () => {
                this.generateMesh();
            }
        );
    }

    public refreshHeatMaps(): void {
        for (let i: number = 0; i < this.tiles.length; i++) {
            for (let j: number = 0; j < this.tiles[i].length; j++) {
                if (this.tiles[i][j].hasHeatMap) {
                    this.tiles[i][j].refreshHeatMap();
                }
            }
        }
    }

    public tile(x: number, z: number): Tile {
        if (this.tiles[x] && this.tiles[x][z]) {
            return this.tiles[x][z];
        }
        return undefined;
    }

    public load(data: TerrainData, callback?: () => void): void {
        this.tiles = [];
        for (let i: number = 0; i < data.tiles.length; i++) {
            this.tiles[i] = [];
            for (let j: number = 0; j < data.tiles[i].length; j++) {
                this.tiles[i][j] = new Tile(i, j, this);
                this.tiles[i][j].deserialize(data.tiles[i][j]);
            }
        }
        if (callback) {
            callback();
        }
    }

    public generateMesh(): void {
        this.mesh = new BABYLON.Mesh("Terrain", this.scene);
        let grid: number[][] = [];
        for (let i: number = 0; i < this.tiles.length; i++) {
            grid[i] = [];
            for (let j: number = 0; j < this.tiles[i].length; j++) {
                if (this.tiles[i][j].buildable) {
                    grid[i][j] = 1;
                } else {
                    grid[i][j] = 0;
                }
            }
        }
        TerrainMeshBuilder.buildForGrid(grid).applyToMesh(this.mesh);
        let terrainMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("TerrainMaterial", this.scene);
        terrainMaterial.diffuseTexture = new BABYLON.Texture("./data/ground-texture.png", this.scene);
        this.mesh.material = terrainMaterial;
    }
}