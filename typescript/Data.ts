enum BuildingType {
    Tower,
    Spawner,
    Wall,
    Gatling
}

class TileData {
    public buildable: boolean;
    public building: BuildingType;
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
        data.tiles[6][17].building = BuildingType.Spawner;

        return data;
    }
}