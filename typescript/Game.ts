class Game {

    private static Log = (o: any) => {console.log("[Game]   " + o)};
    private static Warn = (o: any) => {console.warn("[Game]   " + o)};

    public scene: BABYLON.Scene;

    public players: Player[] = [];
    public resources: Map<Player, number> = new Map<Player, number>();
    public terrain: Terrain;

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.terrain = new Terrain(this);
    }

    public AddNewPlayer(name: string, isHuman: boolean) {
        Game.Log("create new player '" + name + "'");
        let newPlayer: Player = new Player(name, isHuman, this);
        this.players.push(newPlayer);
        this.resources.set(newPlayer, 1000);
    }

    public BuildWall(player: Player, i: number, j: number): void {
        Game.Log(player + " request wall at " + LogUtils.IJToString(i, j) + ".");
        let tile: Tile = this.terrain.tile(i, j);
        if (!tile) {
            return Game.Warn("tile " + LogUtils.IJToString(i, j) + " does not exists.");
        }
        let resources = this.resources.get(player);
        if (this.resources.get(player) < 5) {
            return Game.Warn(player + " has no enough resources to build wall.");
        }
        let result: boolean = tile.createWall();
        if (!result) {
            return Game.Warn("tile " + LogUtils.IJToString(i, j) + " is not empty.");
        }
        this.resources.set(player, resources - 5);
        return Game.Log(player + " succesfuly built wall at " + LogUtils.IJToString(i, j) + ".");
    }

    public BuildTower(player: Player, i: number, j: number): void {
        Game.Log(player + " request tower at " + LogUtils.IJToString(i, j) + ".");
        let tile: Tile = this.terrain.tile(i, j);
        if (!tile) {
            return Game.Warn("tile " + LogUtils.IJToString(i, j) + " does not exists.");
        }
        let resources = this.resources.get(player);
        if (this.resources.get(player) < 30) {
            return Game.Warn(player + " has no enough resources to build tower.");
        }
        let result: boolean = tile.createTower();
        if (!result) {
            return Game.Warn("tile " + LogUtils.IJToString(i, j) + " is not empty.");
        }
        this.resources.set(player, resources - 30);
        return Game.Log(player + " succesfuly built tower at " + LogUtils.IJToString(i, j) + ".");
    }

    public BuildGatling(player: Player, i: number, j: number): void {
        Game.Log(player + " request gatling at " + LogUtils.IJToString(i, j) + ".");
        let tile: Tile = this.terrain.tile(i, j);
        if (!tile) {
            return Game.Warn("tile " + LogUtils.IJToString(i, j) + " does not exists.");
        }
        let resources = this.resources.get(player);
        if (this.resources.get(player) < 15) {
            return Game.Warn(player + " has no enough resources to build gatling.");
        }
        let result: boolean = tile.createGatling();
        if (!result) {
            return Game.Warn("tile " + LogUtils.IJToString(i, j) + " is not empty.");
        }
        this.resources.set(player, resources - 15);
        return Game.Log(player + " succesfuly built gatling at " + LogUtils.IJToString(i, j) + ".");
    }
}