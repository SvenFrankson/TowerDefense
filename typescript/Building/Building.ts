abstract class Building extends BABYLON.Mesh {

    protected _isLoaded: boolean = false;
    public hitpoint: number = 100;

    public tile: Tile;
    public get scene(): BABYLON.Scene {
        return this.tile.scene;
    }
    public get game(): Game {
        return this.tile.game;
    }

    constructor(
        name: string,
        tile: Tile
    ) {
        super(name, tile.scene);
        this.tile = tile;
        this.position.copyFromFloats(this.tile.x * 2.5, 0, this.tile.z * 2.5);
        tile.scene.registerBeforeRender(this.updateCallback);
    }

    public abstract load(): void;

    private updateCallback = () => {
        this.update();
    }
    public abstract update(): void;

    public abstract buildingType(): BuildingType;
}