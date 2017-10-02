class Player {

    public static human: Player;

    private static Log = (o: any) => {console.log("[Player] " + o)};
    private static Warn = (o: any) => {console.warn("[Player] " + o)};
    private static Error = (o: any) => {console.error("[Player] " + o)};

    public game: Game;

    public name: string;

    constructor(name: string, isHuman: boolean, game: Game) {
        Player.Log("create new player '" + name + "'.");
        this.name = name;
        if (isHuman) {
            Player.Log("player '" + name + "' is declared human.");
            if (!Player.human) {
                Player.human = this;
            } else {
                Player.Error("a player has already been declared human.");
            }
        }
        this.game = game;
    }

    public get resources(): number {
        return this.game.resources.get(this);
    }

    public toString(): string {
        return "'" + this.name + "'";
    }
}