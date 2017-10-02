abstract class Creep extends BABYLON.Mesh {

    public static instances: Creep[] = [];
    protected _isLoaded: boolean = false;
    public get iPos(): number {
        return Math.round(this.position.x / 2.5);
    }
    public get jPos(): number {
        return Math.round(this.position.z / 2.5);
    }
    public size: number = 0.5;
    public speed: number = 1;
    public hitpoint: number = 4;
    public game: Game;
    public get terrain(): Terrain {
        return this.game.terrain;
    }

    // AI
    public objective: Tile;

    public action: boolean = false;
    public nextMove: BABYLON.Vector3 = BABYLON.Vector3.Zero();

    constructor(
        name: string,
        game: Game
    ) {
        super(name, game.scene);
        this.game = game;
        Creep.instances.push(this);
        this.getScene().registerBeforeRender(this.update);
    }

    public abstract load(): void;
    public abstract kill(): void;

    public wound(amount: number): void {
        this.hitpoint -= amount;
        if (this.hitpoint <= 0) {
            this.kill();
        }
    }

    public findObjective(): void {
        // creep always wants to reach 2 0.
        this.objective = this.terrain.tile(2, 0);
    }

    private _lastIPos: number = NaN;
    private _lastJPos: number = NaN;
    public findAction(): void {
        if (this.iPos !== this._lastIPos || this.jPos !== this._lastJPos) {
            this._lastIPos = this.iPos;
            this._lastJPos = this.jPos;
            let heats: number[][] = this.objective.heatsFor(this.iPos, this.jPos);
            let minPosition = this.minimalHeat(heats);
            if (minPosition.i !== 0 || minPosition.j !== 0) {
                this.nextMove.copyFromFloats(this.iPos + minPosition.i, 0, this.jPos + minPosition.j);
                this.nextMove.scaleInPlace(2.5);
                this.action = true;
            } else {
                this.action = false;
            }
        }
    }

    private minimalHeat(heats: number[][]): {i: number, j: number} {
        let min: {i: number, j: number} = {i: 0, j: 0};
        let minValue: number = heats[1][1];
        if (heats[0][1] <= minValue) {
            minValue = heats[0][1];
            min.i = -1;
            min.j = 0;
        }
        if (heats[2][1] <= minValue) {
            minValue = heats[2][1];
            min.i = 1;
            min.j = 0;
        }
        if (heats[1][0] <= minValue) {
            minValue = heats[1][0];
            min.i = 0;
            min.j = -1;
        }
        if (heats[1][2] <= minValue) {
            minValue = heats[1][2];
            min.i = 0;
            min.j = 1;
        }

        return min;
    }

    public doAction(): void {
        if (this.action) {
            let deltaTime: number = this.getScene().getEngine().getDeltaTime() / 1000;
            this._moveDir.copyFrom(this.nextMove);
            this._moveDir.subtractInPlace(this.position);
            this._moveDir.normalize();
            this._moveDir.scaleInPlace(this.speed * deltaTime);
            this.position.addInPlace(this._moveDir);
            this.lookAt(this.nextMove);
        }
    }

    private _moveDir: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public update = () => {
        if (this._isLoaded) {
            this.findObjective();
            this.findAction();
            this.doAction();
        }
    }
}