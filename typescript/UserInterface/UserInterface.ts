class UserInterface {
    
    public get scene(): BABYLON.Scene {
        return this.game.scene;
    }

    public game: Game;
    
    private tileUserInterface: TileUserInterface;

    constructor(game: Game) {
        this.game = game;
        this.tileUserInterface = new TileUserInterface(this);
        this.scene.onPointerObservable.add(this.onClick);
    }

    private onClick = (eventData: BABYLON.PointerInfo, eventState: BABYLON.EventState) => {
        if (eventData.type === BABYLON.PointerEventTypes._POINTERUP) {
            if (eventData.pickInfo.pickedPoint) {
                let i: number = Math.round(eventData.pickInfo.pickedPoint.x / 2.5);
                let j: number = Math.round(eventData.pickInfo.pickedPoint.z / 2.5);
                let tile: Tile = this.game.terrain.tile(i, j);
                this.tileUserInterface.selectedTile = tile;
            }
        }
    }
}