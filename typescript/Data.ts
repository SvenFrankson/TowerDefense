enum BuildingType {
    Tower,
    Spawner,
    Wall,
    Gatling,
    Props
}

class BuildingData {
    public type: BuildingType;
    public name?: string;
    public orientation?: number;
    public spawns?: Spawn[];
}

class TileData {
    public buildable: boolean;
    public building: BuildingData;
}

class TerrainData {
    public tiles: TileData[][];

    public static Test(): TerrainData {
        let data: TerrainData = new TerrainData();
        data.tiles = [];
        for (let i: number = 0; i < 10; i++) {
            data.tiles[i] = [];
            for (let j: number = 0; j < 20; j++) {
                data.tiles[i][j] = new TileData();
            }
        }

        for (let i: number = 0; i < 10; i++) {
            for (let j: number = 3; j <= 15; j++) {
                if (Math.random() > 0.5) {
                    data.tiles[i][j].buildable = true;
                }
            }
        }

        data.tiles[6][17].buildable = true;
        data.tiles[6][17].building = {
            type: BuildingType.Spawner,
            name: "",
            orientation: 0,
            spawns: [
                new Spawn("d", 120),
                new Spawn("d", 240),
                new Spawn("d", 360),
                new Spawn("d", 620),
                new Spawn("d", 740),
                new Spawn("d", 860),
                new Spawn("d", 1120),
                new Spawn("d", 1240),
                new Spawn("d", 1360),
                new Spawn("d", 1620),
                new Spawn("d", 1740),
                new Spawn("d", 1860),
                new Spawn("d", 2120),
                new Spawn("d", 2240),
                new Spawn("d", 2360),
            ]
        };

        data.tiles[6][18].buildable = true;
        data.tiles[6][18].building =  {
            type: BuildingType.Props,
            name: "pyramid",
            orientation: 2
        };

        return data;
    }
}