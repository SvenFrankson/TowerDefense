class TileUserInterface {
    
    public userInterface: UserInterface;

    public get game(): Game {
        return this.userInterface.game;
    }
    
    public get scene(): BABYLON.Scene {
        return this.game.scene;
    }

    public guiTexture: BABYLON.GUI.AdvancedDynamicTexture;
    public stackControl: BABYLON.GUI.StackPanel;
    public createGatlingControl: BABYLON.GUI.Button;
    public createTowerControl: BABYLON.GUI.Button;
    public createWallControl: BABYLON.GUI.Button;
    public disposeBuildingControl: BABYLON.GUI.Button;

    private _selectedTile: Tile;
    public get selectedTile(): Tile {
        return this._selectedTile;
    }
    public set selectedTile(t: Tile) {
        if (this._selectedTile && this._selectedTile !== t) {
            this.unselect(this._selectedTile);
        }
        this._selectedTile = t;
        if (this._selectedTile) {
            this.select(this._selectedTile);
        }
    }

    private _tileSelector: BABYLON.AbstractMesh;
    private get tileSelector(): BABYLON.AbstractMesh {
        if (!this._tileSelector) {
            this._tileSelector = BABYLON.MeshBuilder.CreateGround("TileSelector", {width: 2.5, height: 2.5}, this.scene);
            let tileSelectorMaterial = new BABYLON.StandardMaterial("TileSelectorMaterial", this.scene);
            tileSelectorMaterial.diffuseColor.copyFromFloats(0, 1, 0);
            this._tileSelector.material = tileSelectorMaterial;
        }
        return this._tileSelector;
    }

    constructor(UserInterface: UserInterface) {
        this.userInterface = UserInterface;
    }

    public showTileSelectorAt(x: number, z: number): void {
        this.tileSelector.isVisible = true;
        this.tileSelector.position.x = x * 2.5;
        this.tileSelector.position.y = 0.1;
        this.tileSelector.position.z = z * 2.5;
    }
    public hideTileSelector(): void {
        this.tileSelector.isVisible = false;
    }

    public select(tile: Tile): void {
        if (tile.selected) {
            this.reselect(tile);
        } else {
            tile.selected = true;
        }
        this.showTileSelectorAt(tile.x, tile.z);
    }

    public reselect(tile: Tile): void {
        this.closeEditionMenu();
        this.openEditionMenu();
        this.updateEditionMenu(tile);
    }

    public unselect(tile: Tile): void {
        tile.selected = false;
        this.closeEditionMenu();
        this.hideTileSelector();
    }

    public openEditionMenu(): void {
        this.guiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("TileEditionMenu");
    }

    public updateEditionMenu(tile: Tile): void {
        this.stackControl = new BABYLON.GUI.StackPanel("TileEditionStack");
        this.guiTexture.addControl(this.stackControl);
        if (tile.buildable && !tile.building) {

            this.createGatlingControl = BABYLON.GUI.Button.CreateSimpleButton("CreateGatling", "Create Gatling");
            this.createGatlingControl.color = "#ffffff";
            this.createGatlingControl.background = "#000000";
            this.createGatlingControl.width = "100px";
            this.createGatlingControl.height = "30px";
            this.createGatlingControl.fontSize = "10px";
            this.stackControl.addControl(this.createGatlingControl);
            this.createGatlingControl.onPointerUpObservable.add(
                (eventData: BABYLON.Vector2, eventState: BABYLON.EventState) => {
                    this.game.BuildGatling(Player.human, tile.x, tile.z);
                }
            );

            this.createTowerControl = BABYLON.GUI.Button.CreateSimpleButton("CreateTower", "Create Tower");
            this.createTowerControl.color = "#ffffff";
            this.createTowerControl.background = "#000000";
            this.createTowerControl.width = "100px";
            this.createTowerControl.height = "30px";
            this.createTowerControl.fontSize = "10px";
            this.stackControl.addControl(this.createTowerControl);
            this.createTowerControl.onPointerUpObservable.add(
                (eventData: BABYLON.Vector2, eventState: BABYLON.EventState) => {
                    this.game.BuildTower(Player.human, tile.x, tile.z);
                }
            );

            this.createWallControl = BABYLON.GUI.Button.CreateSimpleButton("CreateWall", "Create Wall");
            this.createWallControl.color = "#ffffff";
            this.createWallControl.background = "#000000";
            this.createWallControl.width = "100px";
            this.createWallControl.height = "30px";
            this.createWallControl.fontSize = "10px";
            this.stackControl.addControl(this.createWallControl);
            this.createWallControl.onPointerUpObservable.add(
                (eventData: BABYLON.Vector2, eventState: BABYLON.EventState) => {
                    this.game.BuildWall(Player.human, tile.x, tile.z);
                }
            );
        }
        this.stackControl.moveToVector3(new BABYLON.Vector3(tile.x * 2.5, 0, tile.z * 2.5), this.scene);
    }

    public closeEditionMenu(): void {
        if (this.guiTexture) {
            this.guiTexture.dispose();
        }
    }
}