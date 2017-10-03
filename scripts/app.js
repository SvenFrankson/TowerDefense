class Creep extends BABYLON.Mesh {
    constructor(name, game) {
        super(name, game.scene);
        this._isLoaded = false;
        this.size = 0.5;
        this.speed = 1;
        this.hitpoint = 4;
        this.action = false;
        this.nextMove = BABYLON.Vector3.Zero();
        this._lastIPos = NaN;
        this._lastJPos = NaN;
        this._moveDir = BABYLON.Vector3.Zero();
        this.update = () => {
            if (this._isLoaded) {
                this.findObjective();
                this.findAction();
                this.doAction();
            }
        };
        this.game = game;
        Creep.instances.push(this);
        this.getScene().registerBeforeRender(this.update);
    }
    get iPos() {
        return Math.round(this.position.x / 2.5);
    }
    get jPos() {
        return Math.round(this.position.z / 2.5);
    }
    get terrain() {
        return this.game.terrain;
    }
    wound(amount) {
        this.hitpoint -= amount;
        if (this.hitpoint <= 0) {
            this.kill();
        }
    }
    findObjective() {
        // creep always wants to reach 2 0.
        this.objective = this.terrain.tile(2, 0);
    }
    findAction() {
        if (this.iPos !== this._lastIPos || this.jPos !== this._lastJPos) {
            this._lastIPos = this.iPos;
            this._lastJPos = this.jPos;
            let heats = this.objective.heatsFor(this.iPos, this.jPos);
            let minPosition = this.minimalHeat(heats);
            if (minPosition.i !== 0 || minPosition.j !== 0) {
                this.nextMove.copyFromFloats(this.iPos + minPosition.i, 0, this.jPos + minPosition.j);
                this.nextMove.scaleInPlace(2.5);
                this.action = true;
            }
            else {
                this.action = false;
            }
        }
    }
    minimalHeat(heats) {
        let min = { i: 0, j: 0 };
        let minValue = heats[1][1];
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
    doAction() {
        if (this.action) {
            let deltaTime = this.getScene().getEngine().getDeltaTime() / 1000;
            this._moveDir.copyFrom(this.nextMove);
            this._moveDir.subtractInPlace(this.position);
            this._moveDir.normalize();
            this._moveDir.scaleInPlace(this.speed * deltaTime);
            this.position.addInPlace(this._moveDir);
            this.lookAt(this.nextMove, Math.PI, 0, 0, BABYLON.Space.WORLD);
        }
    }
}
Creep.instances = [];
var BuildingType;
(function (BuildingType) {
    BuildingType[BuildingType["Tower"] = 0] = "Tower";
    BuildingType[BuildingType["Spawner"] = 1] = "Spawner";
    BuildingType[BuildingType["Wall"] = 2] = "Wall";
    BuildingType[BuildingType["Gatling"] = 3] = "Gatling";
})(BuildingType || (BuildingType = {}));
class TileData {
}
class TerrainData {
    static Test() {
        let data = new TerrainData();
        data.tiles = [];
        for (let i = 0; i < 10; i++) {
            data.tiles[i] = [];
            for (let j = 0; j < 20; j++) {
                data.tiles[i][j] = new TileData();
            }
        }
        for (let i = 0; i < 10; i++) {
            for (let j = 3; j <= 15; j++) {
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
class Drone extends Creep {
    constructor(game) {
        super("drone", game);
    }
    load() {
        BABYLON.SceneLoader.ImportMesh("", "./data/" + this.name + ".babylon", "", this.getScene(), (meshes, particleSystems, skeletons) => {
            meshes.forEach((m) => {
                if (m instanceof BABYLON.Mesh) {
                    m.parent = this;
                    m.rotation.copyFromFloats(0, 0, 0);
                    let droneMaterial = new BABYLON.StandardMaterial("DroneMaterial", this.getScene());
                    droneMaterial.diffuseTexture = new BABYLON.Texture("./data/drone-diffuse.png", this.getScene());
                    droneMaterial.specularColor.copyFromFloats(0.2, 0.2, 0.2);
                    m.material = droneMaterial;
                }
            });
            this._isLoaded = true;
        });
    }
    kill() {
        let children = this.getChildren();
        children.forEach((n) => {
            if (n instanceof BABYLON.AbstractMesh) {
                n.dispose();
            }
        });
        let index = Creep.instances.indexOf(this);
        if (index !== -1) {
            Creep.instances.splice(index, 1);
        }
        this.getScene().unregisterBeforeRender(this.update);
    }
}
class Game {
    constructor(scene) {
        this.players = [];
        this.resources = new Map();
        this.scene = scene;
        this.terrain = new Terrain(this);
    }
    AddNewPlayer(name, isHuman) {
        Game.Log("create new player '" + name + "'");
        let newPlayer = new Player(name, isHuman, this);
        this.players.push(newPlayer);
        this.resources.set(newPlayer, 1000);
    }
    BuildWall(player, i, j) {
        Game.Log(player + " request wall at " + LogUtils.IJToString(i, j) + ".");
        let tile = this.terrain.tile(i, j);
        if (!tile) {
            return Game.Warn("tile " + LogUtils.IJToString(i, j) + " does not exists.");
        }
        let resources = this.resources.get(player);
        if (this.resources.get(player) < 5) {
            return Game.Warn(player + " has no enough resources to build wall.");
        }
        let result = tile.createWall();
        if (!result) {
            return Game.Warn("tile " + LogUtils.IJToString(i, j) + " is not empty.");
        }
        this.resources.set(player, resources - 5);
        return Game.Log(player + " succesfuly built wall at " + LogUtils.IJToString(i, j) + ".");
    }
    BuildTower(player, i, j) {
        Game.Log(player + " request tower at " + LogUtils.IJToString(i, j) + ".");
        let tile = this.terrain.tile(i, j);
        if (!tile) {
            return Game.Warn("tile " + LogUtils.IJToString(i, j) + " does not exists.");
        }
        let resources = this.resources.get(player);
        if (this.resources.get(player) < 30) {
            return Game.Warn(player + " has no enough resources to build tower.");
        }
        let result = tile.createTower();
        if (!result) {
            return Game.Warn("tile " + LogUtils.IJToString(i, j) + " is not empty.");
        }
        this.resources.set(player, resources - 30);
        return Game.Log(player + " succesfuly built tower at " + LogUtils.IJToString(i, j) + ".");
    }
    BuildGatling(player, i, j) {
        Game.Log(player + " request gatling at " + LogUtils.IJToString(i, j) + ".");
        let tile = this.terrain.tile(i, j);
        if (!tile) {
            return Game.Warn("tile " + LogUtils.IJToString(i, j) + " does not exists.");
        }
        let resources = this.resources.get(player);
        if (this.resources.get(player) < 15) {
            return Game.Warn(player + " has no enough resources to build gatling.");
        }
        let result = tile.createGatling();
        if (!result) {
            return Game.Warn("tile " + LogUtils.IJToString(i, j) + " is not empty.");
        }
        this.resources.set(player, resources - 15);
        return Game.Log(player + " succesfuly built gatling at " + LogUtils.IJToString(i, j) + ".");
    }
}
Game.Log = (o) => { console.log("[Game]   " + o); };
Game.Warn = (o) => { console.warn("[Game]   " + o); };
class LogUtils {
    static IJToString(i, j) {
        return "(" + i + " ; " + j + ")";
    }
}
class Main {
    constructor(canvasElement) {
        Main.instance = this;
        this.canvas = document.getElementById(canvasElement);
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.engine.enableOfflineSupport = false;
        BABYLON.Engine.ShadersRepository = "./shaders/";
    }
    createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.resize();
        let pointLight1 = new BABYLON.PointLight("Light", new BABYLON.Vector3(5, 20, 5), this.scene);
        pointLight1.intensity = 0.7;
        this.light1 = pointLight1;
        let pointLight2 = new BABYLON.PointLight("Light", new BABYLON.Vector3(-5, 20, 5), this.scene);
        pointLight2.intensity = 0.7;
        this.light2 = pointLight2;
        // let arcCamera: BABYLON.ArcRotateCamera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 1, new BABYLON.Vector3(12.5, 0, 12.5), this.scene);
        // arcCamera.setPosition(new BABYLON.Vector3(-8, 5, 8));
        // arcCamera.attachControl(this.canvas);
        let freeCamera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 10, 0), this.scene);
        freeCamera.setTarget(new BABYLON.Vector3(10, 0, 10));
        freeCamera.attachControl(this.canvas);
        this.camera = freeCamera;
        let game = new Game(this.scene);
        game.AddNewPlayer("Sven", true);
        new UserInterface(game);
    }
    animate() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        window.addEventListener("resize", () => {
            this.resize();
        });
    }
    resize() {
        this.engine.resize();
    }
}
window.addEventListener("DOMContentLoaded", () => {
    let game = new Main("render-canvas");
    game.createScene();
    game.animate();
});
class Player {
    constructor(name, isHuman, game) {
        Player.Log("create new player '" + name + "'.");
        this.name = name;
        if (isHuman) {
            Player.Log("player '" + name + "' is declared human.");
            if (!Player.human) {
                Player.human = this;
            }
            else {
                Player.Error("a player has already been declared human.");
            }
        }
        this.game = game;
    }
    get resources() {
        return this.game.resources.get(this);
    }
    toString() {
        return "'" + this.name + "'";
    }
}
Player.Log = (o) => { console.log("[Player] " + o); };
Player.Warn = (o) => { console.warn("[Player] " + o); };
Player.Error = (o) => { console.error("[Player] " + o); };
class Shell extends BABYLON.Mesh {
    constructor(position, direction, speed, scene) {
        super("Shell", scene);
        this._moveDir = BABYLON.Vector3.Zero();
        this.update = () => {
            let deltaTime = this.getScene().getEngine().getDeltaTime() / 1000;
            this._moveDir.copyFrom(this.direction);
            this._moveDir.scaleInPlace(this.speed * deltaTime);
            this.position.addInPlace(this._moveDir);
            let c = this.intersectsCreep();
            if (c) {
                console.log("Creep Hit !");
                this.explode();
                c.wound(1);
            }
            if (this.position.y < 0) {
                this.explode();
            }
        };
        let sphere = BABYLON.MeshBuilder.CreateSphere("Sphere", { diameter: 0.3 }, scene);
        sphere.parent = this;
        this.position.copyFrom(position);
        this.direction = direction.clone();
        this.speed = speed;
        scene.registerBeforeRender(this.update);
    }
    explode() {
        let children = this.getChildren();
        children.forEach((n) => {
            if (n instanceof BABYLON.AbstractMesh) {
                n.dispose();
            }
        });
        this.getScene().unregisterBeforeRender(this.update);
    }
    intersectsCreep() {
        for (let i = 0; i < Creep.instances.length; i++) {
            let c = Creep.instances[i];
            if (BABYLON.Vector3.DistanceSquared(this.position, c.position.add(new BABYLON.Vector3(0, 0.5, 0))) < c.size * c.size) {
                return c;
            }
        }
        return undefined;
    }
}
class TDMath {
    static IsNanOrZero(n) {
        return isNaN(n) || n === 0;
    }
    static ProjectPerpendicularAtToRef(v, at, ref) {
        if (v && at) {
            let k = BABYLON.Vector3.Dot(v, at);
            k = k / at.lengthSquared();
            if (isFinite(k)) {
                ref.copyFrom(v);
                ref.subtractInPlace(at.scale(k));
            }
        }
    }
    static ProjectPerpendicularAt(v, at) {
        let out = BABYLON.Vector3.Zero();
        TDMath.ProjectPerpendicularAtToRef(v, at, out);
        return out;
    }
    static Angle(from, to) {
        return Math.acos(BABYLON.Vector3.Dot(from, to) / from.length() / to.length());
    }
    static AngleFromToAround(from, to, around, onlyPositive = false) {
        let pFrom = TDMath.ProjectPerpendicularAt(from, around).normalize();
        if (TDMath.IsNanOrZero(pFrom.lengthSquared())) {
            return NaN;
        }
        let pTo = TDMath.ProjectPerpendicularAt(to, around).normalize();
        if (TDMath.IsNanOrZero(pTo.lengthSquared())) {
            return NaN;
        }
        let angle = Math.acos(BABYLON.Vector3.Dot(pFrom, pTo));
        if (BABYLON.Vector3.Dot(BABYLON.Vector3.Cross(pFrom, pTo), around) < 0) {
            if (onlyPositive) {
                angle = 2 * Math.PI - angle;
            }
            else {
                angle = -angle;
            }
        }
        return angle;
    }
}
class Terrain {
    get scene() {
        return this.game.scene;
    }
    get width() {
        return this.tiles.length;
    }
    get height() {
        return this.tiles[0].length;
    }
    constructor(game) {
        this.game = game;
        this.load(TerrainData.Test(), () => {
            this.generateMesh();
        });
    }
    refreshHeatMaps() {
        for (let i = 0; i < this.tiles.length; i++) {
            for (let j = 0; j < this.tiles[i].length; j++) {
                if (this.tiles[i][j].hasHeatMap) {
                    this.tiles[i][j].refreshHeatMap();
                }
            }
        }
    }
    tile(x, z) {
        if (this.tiles[x] && this.tiles[x][z]) {
            return this.tiles[x][z];
        }
        return undefined;
    }
    load(data, callback) {
        this.tiles = [];
        for (let i = 0; i < data.tiles.length; i++) {
            this.tiles[i] = [];
            for (let j = 0; j < data.tiles[i].length; j++) {
                this.tiles[i][j] = new Tile(i, j, this);
                this.tiles[i][j].deserialize(data.tiles[i][j]);
            }
        }
        if (callback) {
            callback();
        }
    }
    generateMesh() {
        this.mesh = new BABYLON.Mesh("Terrain", this.scene);
        let grid = [];
        for (let i = 0; i < this.tiles.length; i++) {
            grid[i] = [];
            for (let j = 0; j < this.tiles[i].length; j++) {
                if (this.tiles[i][j].buildable) {
                    grid[i][j] = 1;
                }
                else {
                    grid[i][j] = 0;
                }
            }
        }
        TerrainMeshBuilder.buildForGrid(grid).applyToMesh(this.mesh);
        let terrainMaterial = new BABYLON.StandardMaterial("TerrainMaterial", this.scene);
        terrainMaterial.diffuseTexture = new BABYLON.Texture("./data/ground-texture.png", this.scene);
        this.mesh.material = terrainMaterial;
    }
}
class TerrainMeshBuilder {
    static clampedValueAtIJ(i, j, grid) {
        i = Math.min(grid.length - 1, Math.max(i, 0));
        if (grid[i]) {
            j = Math.min(grid[i].length - 1, Math.max(j, 0));
            return grid[i][j];
        }
        return NaN;
    }
    static uvsForABCD(a, b, c, d) {
        let s = "" + a + b + c + d;
        if (s === "0000") {
            return [
                1 / 3, 2 / 3,
                1 / 3, 1,
                2 / 3, 1,
                2 / 3, 2 / 3
            ];
        }
        if (s === "0001") {
            return [
                2 / 3, 2 / 3,
                2 / 3, 1,
                1, 1,
                1, 2 / 3
            ];
        }
        if (s === "0010") {
            return [
                2 / 3, 1,
                1, 1,
                1, 2 / 3,
                2 / 3, 2 / 3
            ];
        }
        if (s === "0011") {
            return [
                2 / 3, 2 / 3,
                2 / 3, 1 / 3,
                1 / 3, 1 / 3,
                1 / 3, 2 / 3
            ];
        }
        if (s === "0100") {
            return [
                1, 1,
                1, 2 / 3,
                2 / 3, 2 / 3,
                2 / 3, 1
            ];
        }
        if (s === "0101") {
            return [
                2 / 3, 1 / 3,
                2 / 3, 2 / 3,
                1, 2 / 3,
                1, 1 / 3
            ];
        }
        if (s === "0110") {
            return [
                2 / 3, 1 / 3,
                1 / 3, 1 / 3,
                1 / 3, 2 / 3,
                2 / 3, 2 / 3
            ];
        }
        if (s === "0111") {
            return [
                1 / 3, 1 / 3,
                0, 1 / 3,
                0, 2 / 3,
                1 / 3, 2 / 3
            ];
        }
        if (s === "1000") {
            return [
                1, 2 / 3,
                2 / 3, 2 / 3,
                2 / 3, 1,
                1, 1,
            ];
        }
        if (s === "1001") {
            return [
                1 / 3, 2 / 3,
                2 / 3, 2 / 3,
                2 / 3, 1 / 3,
                1 / 3, 1 / 3
            ];
        }
        if (s === "1010") {
            return [
                1, 1 / 3,
                2 / 3, 1 / 3,
                2 / 3, 2 / 3,
                1, 2 / 3
            ];
        }
        if (s === "1011") {
            return [
                1 / 3, 2 / 3,
                1 / 3, 1 / 3,
                0, 1 / 3,
                0, 2 / 3
            ];
        }
        if (s === "1100") {
            return [
                1 / 3, 1 / 3,
                1 / 3, 2 / 3,
                2 / 3, 2 / 3,
                2 / 3, 1 / 3
            ];
        }
        if (s === "1101") {
            return [
                0, 2 / 3,
                1 / 3, 2 / 3,
                1 / 3, 1 / 3,
                0, 1 / 3
            ];
        }
        if (s === "1110") {
            return [
                0, 1 / 3,
                0, 2 / 3,
                1 / 3, 2 / 3,
                1 / 3, 1 / 3
            ];
        }
        if (s === "1111") {
            return [
                0, 2 / 3,
                0, 1,
                1 / 3, 1,
                1 / 3, 2 / 3
            ];
        }
        console.log("Bug " + s);
        return [
            0, 0,
            0, 1,
            1, 1,
            1, 0
        ];
    }
    static buildForGrid(grid) {
        let width = grid.length;
        let length = grid[0].length;
        let data = new BABYLON.VertexData();
        let positions = [];
        let indices = [];
        let uvs = [];
        for (let i = -1; i < width; i++) {
            for (let j = -1; j < length; j++) {
                let a = TerrainMeshBuilder.clampedValueAtIJ(i, j + 1, grid);
                let b = TerrainMeshBuilder.clampedValueAtIJ(i + 1, j + 1, grid);
                let c = TerrainMeshBuilder.clampedValueAtIJ(i + 1, j, grid);
                let d = TerrainMeshBuilder.clampedValueAtIJ(i, j, grid);
                let index = positions.length / 3;
                positions.push(2.5 * i, 0, 2.5 * j);
                positions.push(2.5 * i, 0, 2.5 * (j + 1));
                positions.push(2.5 * (i + 1), 0, 2.5 * (j + 1));
                positions.push(2.5 * (i + 1), 0, 2.5 * j);
                indices.push(index, index + 3, index + 2);
                indices.push(index, index + 2, index + 1);
                uvs.push(...TerrainMeshBuilder.uvsForABCD(a, b, c, d));
            }
        }
        data.positions = positions;
        data.indices = indices;
        data.uvs = uvs;
        return data;
    }
}
class Tile {
    constructor(x, z, terrain) {
        this.selected = false;
        this.buildable = false;
        this.name = "x" + x + "z" + z;
        this.x = x;
        this.z = z;
        this.terrain = terrain;
    }
    get scene() {
        return this.terrain.scene;
    }
    get game() {
        return this.terrain.game;
    }
    get heatMap() {
        if (!this._heatMap) {
            this.refreshHeatMap();
        }
        return this._heatMap;
    }
    get hasHeatMap() {
        return this._heatMap !== undefined;
    }
    deserialize(data) {
        this.buildable = data.buildable;
        if (data.building === BuildingType.Spawner) {
            this.building = new Spawner(this);
            this.building.load();
        }
    }
    createTower() {
        if (this.building) {
            return false; // tile already has tower
        }
        this.building = new Tower(this);
        this.building.load();
        this.terrain.refreshHeatMaps();
        return true;
    }
    createGatling() {
        if (this.building) {
            return false; // tile already has tower
        }
        this.building = new Gatling(this);
        this.building.load();
        this.terrain.refreshHeatMaps();
        return true;
    }
    createWall() {
        if (this.building) {
            return false; // tile already has tower
        }
        this.building = new Wall(this);
        this.building.load();
        this.terrain.refreshHeatMaps();
        return true;
    }
    refreshHeatMap() {
        this._heatMap = [];
        for (let i = 0; i < this.terrain.width; i++) {
            this._heatMap[i] = [];
            for (let j = 0; j < this.terrain.height; j++) {
                this._heatMap[i][j] = Infinity;
            }
        }
        this._heatMap[this.x][this.z] = 0;
        let updated = [new BABYLON.Vector2(this.x, this.z)];
        while (updated.length > 0) {
            updated = this.stepUpdateHeatMap(updated);
        }
        this.clearBuildingHeatMap();
    }
    stepUpdateHeatMap(current) {
        let updated = [];
        current.forEach((c) => {
            let i = c.x;
            let j = c.y;
            let heat = this._heatMap[i][j];
            if (this.terrain.tile(i - 1, j)) {
                let threshold = heat + 1;
                if (this.terrain.tile(i - 1, j).building) {
                    threshold += this.terrain.tile(i - 1, j).building.hitpoint;
                }
                if (this._heatMap[i - 1][j] > threshold) {
                    this._heatMap[i - 1][j] = threshold;
                    updated.push(new BABYLON.Vector2(i - 1, j));
                }
            }
            if (this.terrain.tile(i + 1, j)) {
                let threshold = heat + 1;
                if (this.terrain.tile(i + 1, j).building) {
                    threshold += this.terrain.tile(i + 1, j).building.hitpoint;
                }
                if (this._heatMap[i + 1][j] > threshold) {
                    this._heatMap[i + 1][j] = threshold;
                    updated.push(new BABYLON.Vector2(i + 1, j));
                }
            }
            if (this.terrain.tile(i, j - 1)) {
                let threshold = heat + 1;
                if (this.terrain.tile(i, j - 1).building) {
                    threshold += this.terrain.tile(i, j - 1).building.hitpoint;
                }
                if (this._heatMap[i][j - 1] > threshold) {
                    this._heatMap[i][j - 1] = threshold;
                    updated.push(new BABYLON.Vector2(i, j - 1));
                }
            }
            if (this.terrain.tile(i, j + 1)) {
                let threshold = heat + 1;
                if (this.terrain.tile(i, j + 1).building) {
                    threshold += this.terrain.tile(i, j + 1).building.hitpoint;
                }
                if (this._heatMap[i][j + 1] > threshold) {
                    this._heatMap[i][j + 1] = threshold;
                    updated.push(new BABYLON.Vector2(i, j + 1));
                }
            }
        });
        return updated;
    }
    clearBuildingHeatMap() {
        for (let i = 0; i < this.terrain.width; i++) {
            for (let j = 0; j < this.terrain.height; j++) {
                if (this.terrain.tile(i, j).building) {
                    this._heatMap[i][j] = Infinity;
                }
            }
        }
    }
    heat(i, j) {
        if (this.heatMap[i] && this.heatMap[i][j]) {
            return this.heatMap[i][j];
        }
        return Infinity;
    }
    heatsFor(i, j) {
        let heats = [];
        for (let ii = -1; ii <= 1; ii++) {
            heats[ii + 1] = [];
            for (let jj = -1; jj <= 1; jj++) {
                heats[ii + 1][jj + 1] = this.heat(i + ii, j + jj);
            }
        }
        return heats;
    }
    serialize() {
        let data = new TileData();
        data.buildable = this.buildable;
        if (this.building) {
            data.building = this.building.buildingType();
        }
        return data;
    }
}
class Building extends BABYLON.Mesh {
    constructor(name, tile) {
        super(name, tile.scene);
        this._isLoaded = false;
        this.hitpoint = 100;
        this.updateCallback = () => {
            this.update();
        };
        this.tile = tile;
        this.position.copyFromFloats(this.tile.x * 2.5, 0, this.tile.z * 2.5);
        tile.scene.registerBeforeRender(this.updateCallback);
    }
    get scene() {
        return this.tile.scene;
    }
    get game() {
        return this.tile.game;
    }
}
class Gatling extends Building {
    constructor(tile) {
        super("Gatling", tile);
        this.rotationSpeed = Math.PI / 2;
        this.cooldown = 90;
        this._tmp = BABYLON.Vector3.Zero();
        this._canonDir = BABYLON.Vector3.Zero();
        this._canonRight = BABYLON.Vector3.Zero();
        this._reloading = false;
        this._tmpTargetDirection = BABYLON.Vector3.Zero();
        this._targetPosition = BABYLON.Vector3.Zero();
        this._kkFire = Infinity;
        this._kFire = 0;
        this._rays = [];
        this.fireAnim = () => {
            this._kkFire++;
            if (this._kkFire > Gatling.FireRate) {
                this._tmpTargetDirection.copyFrom(this._targetPosition);
                this._tmpTargetDirection.x += (Math.random() - 0.5) * 1;
                this._tmpTargetDirection.y += (Math.random() - 0.5) * 1;
                this._tmpTargetDirection.z += (Math.random() - 0.5) * 1;
                this._tmpTargetDirection.subtractInPlace(this.canon.absolutePosition);
                this._tmpTargetDirection.normalize();
                this._rays.push(BABYLON.RayHelper.CreateAndShow(new BABYLON.Ray(this.canon.absolutePosition.clone(), this._tmpTargetDirection.clone()), this.scene, BABYLON.Color3.Red()));
                this._kkFire = 0;
                this._kFire++;
            }
            if (this._kFire >= Gatling.BulletCount) {
                this._kReload = 0;
                this._kkReload = Infinity;
                this.getScene().unregisterBeforeRender(this.fireAnim);
                this.getScene().registerBeforeRender(this.reloadAnim);
            }
        };
        this._kkReload = Infinity;
        this._kReload = 0;
        this.reloadAnim = () => {
            this._kkReload++;
            if (this._kkReload > Gatling.FireRate) {
                if (this._rays.length > 0) {
                    this._rays.splice(0, 1)[0].dispose();
                }
                this._kkReload = 0;
            }
            this._kReload++;
            if (this._kReload >= this.cooldown) {
                while (this._rays.length > 0) {
                    this._rays.splice(0, 1)[0].dispose();
                }
                this.getScene().unregisterBeforeRender(this.reloadAnim);
                this._reloading = false;
            }
        };
        this.hitpoint = 30;
    }
    load() {
        BABYLON.SceneLoader.ImportMesh("", "./data/gatling.babylon", "", this.getScene(), (meshes, particleSystems, skeletons) => {
            meshes.forEach((m) => {
                if (m instanceof BABYLON.Mesh) {
                    if (m.name === "Body") {
                        this.body = m;
                        this.body.parent = this;
                    }
                    if (m.name === "Canon") {
                        this.canon = m;
                        this.canon.parent = this;
                    }
                }
            });
            if (!this.body || !this.canon) {
                return console.error("Failed to load some part of 'Gatling'.");
            }
            this.body.parent = this;
            this.canon.parent = this.body;
            this._isLoaded = true;
        });
    }
    aimAt(position) {
        let deltaTime = this.getScene().getEngine().getDeltaTime() / 1000;
        this.canon.getDirectionToRef(BABYLON.Axis.Z, this._canonDir);
        this._canonDir.normalize();
        this.canon.getDirectionToRef(BABYLON.Axis.X, this._canonRight);
        this._canonRight.normalize();
        this._tmp.copyFrom(position);
        this._tmp.subtractInPlace(this.canon.getAbsolutePosition());
        this._tmp.normalize();
        let alpha = TDMath.AngleFromToAround(this._canonDir, this._tmp, BABYLON.Axis.Y);
        if (isFinite(alpha)) {
            let a = Math.min(Math.abs(alpha), deltaTime * this.rotationSpeed);
            this.canon.rotate(BABYLON.Axis.Y, BABYLON.Scalar.Sign(alpha) * a);
            if (Math.abs(alpha) < Math.PI / 8) {
                this._tmp.copyFrom(position);
                this._tmp.subtractInPlace(this.canon.getAbsolutePosition());
                this._tmp.normalize();
                let beta = TDMath.AngleFromToAround(this._canonDir, this._tmp, this._canonRight);
                if (isFinite(beta)) {
                    let b = Math.min(Math.abs(beta), deltaTime * this.rotationSpeed);
                    this.canon.rotate(BABYLON.Axis.X, BABYLON.Scalar.Sign(beta) * b, BABYLON.Space.LOCAL);
                    return Math.abs(alpha) < Math.PI / 32 && Math.abs(beta) < Math.PI / 32;
                }
            }
        }
        return false;
    }
    closestCreep() {
        let minSqrDist = Infinity;
        let creep;
        Creep.instances.forEach((c) => {
            let sqrDist = BABYLON.Vector3.DistanceSquared(this.position, c.position);
            if (sqrDist < minSqrDist) {
                minSqrDist = sqrDist;
                creep = c;
            }
        });
        return creep;
    }
    update() {
        if (this._isLoaded) {
            let creep = this.closestCreep();
            if (creep) {
                if (this.aimAt(creep.position.add(new BABYLON.Vector3(0, 0.5, 0)))) {
                    if (this.shoot(creep.position.add(new BABYLON.Vector3(0, 0.5, 0)))) {
                        creep.wound(1);
                    }
                }
            }
        }
    }
    shoot(target) {
        if (!this._reloading) {
            this._reloading = true;
            this._kFire = 0;
            this._kkFire = Infinity;
            this._targetPosition.copyFrom(target);
            this.getScene().registerBeforeRender(this.fireAnim);
            return true;
        }
        return false;
    }
    buildingType() {
        return BuildingType.Gatling;
    }
}
Gatling.BulletCount = 10;
Gatling.FireRate = 2;
class Spawner extends Building {
    constructor(tile) {
        super("Spawner", tile);
        this._kSpawn = 0;
        this.hitpoint = 42000;
    }
    load() {
        this._isLoaded = true;
        BABYLON.SceneLoader.ImportMesh("", "./data/spawner.babylon", "", this.getScene(), (meshes, particleSystems, skeletons) => {
        });
    }
    update() {
        if (this._isLoaded) {
            this.spawn();
        }
    }
    spawn() {
        this._kSpawn++;
        if (this._kSpawn > 300) {
            let creep = new Drone(this.game);
            creep.load();
            creep.position.copyFrom(this.position);
            this._kSpawn = 0;
        }
    }
    buildingType() {
        return BuildingType.Spawner;
    }
}
class Tower extends Building {
    constructor(tile) {
        super("Tower", tile);
        this.rotationSpeed = Math.PI / 2;
        this.cooldown = 180;
        this._tmp = BABYLON.Vector3.Zero();
        this._headDir = BABYLON.Vector3.Zero();
        this._barrelDir = BABYLON.Vector3.Zero();
        this._barrelRight = BABYLON.Vector3.Zero();
        this._reloading = false;
        this._kFire = 0;
        this.fireAnim = () => {
            BABYLON.Vector3.LerpToRef(Tower.CanonRestPosition, Tower.FireCanonEndPosition, this._kFire++ / Tower.FireDuration, this.canon.position);
            if (this._kFire >= Tower.FireDuration) {
                this._kReload = 0;
                this.getScene().unregisterBeforeRender(this.fireAnim);
                this.getScene().registerBeforeRender(this.reloadAnim);
            }
        };
        this._kReload = 0;
        this.reloadAnim = () => {
            BABYLON.Vector3.LerpToRef(Tower.FireCanonEndPosition, Tower.CanonRestPosition, this._kReload++ / this.cooldown, this.canon.position);
            if (this._kReload >= this.cooldown) {
                this.getScene().unregisterBeforeRender(this.reloadAnim);
                this._reloading = false;
            }
        };
        this.hitpoint = 30;
    }
    load() {
        BABYLON.SceneLoader.ImportMesh("", "./data/tower.babylon", "", this.getScene(), (meshes, particleSystems, skeletons) => {
            meshes.forEach((m) => {
                if (m instanceof BABYLON.Mesh) {
                    if (m.name === "Body") {
                        this.body = m;
                        this.body.parent = this;
                    }
                    if (m.name === "Head") {
                        this.head = m;
                        this.head.parent = this;
                    }
                    if (m.name === "Barrel") {
                        this.barrel = m;
                        this.barrel.parent = this;
                    }
                    if (m.name === "Canon") {
                        this.canon = m;
                        this.canon.parent = this;
                    }
                }
            });
            if (!this.body || !this.head || !this.barrel || !this.canon) {
                return console.error("Failed to load some part of 'Tower'.");
            }
            this.body.parent = this;
            this.head.parent = this.body;
            this.barrel.parent = this.head;
            this.canon.parent = this.barrel;
            this._isLoaded = true;
        });
    }
    aimAt(position) {
        let deltaTime = this.getScene().getEngine().getDeltaTime() / 1000;
        this.head.getDirectionToRef(BABYLON.Axis.Z, this._headDir);
        this._headDir.normalize();
        this.barrel.getDirectionToRef(BABYLON.Axis.Z, this._barrelDir);
        this.barrel.getDirectionToRef(BABYLON.Axis.X, this._barrelRight);
        this._barrelDir.normalize();
        this._barrelRight.normalize();
        this._tmp.copyFrom(position);
        this._tmp.subtractInPlace(this.head.getAbsolutePosition());
        this._tmp.normalize();
        let alpha = TDMath.AngleFromToAround(this._headDir, this._tmp, BABYLON.Axis.Y);
        if (isFinite(alpha)) {
            let a = Math.min(Math.abs(alpha), deltaTime * this.rotationSpeed);
            this.head.rotate(BABYLON.Axis.Y, BABYLON.Scalar.Sign(alpha) * a);
            if (Math.abs(alpha) < Math.PI / 8) {
                this._tmp.copyFrom(position);
                this._tmp.subtractInPlace(this.barrel.getAbsolutePosition());
                this._tmp.normalize();
                let beta = TDMath.AngleFromToAround(this._barrelDir, this._tmp, this._barrelRight);
                if (isFinite(beta)) {
                    let b = Math.min(Math.abs(beta), deltaTime * this.rotationSpeed);
                    this.barrel.rotate(BABYLON.Axis.X, BABYLON.Scalar.Sign(beta) * b, BABYLON.Space.LOCAL);
                    return Math.abs(alpha) < Math.PI / 32 && Math.abs(beta) < Math.PI / 32;
                }
            }
        }
        return false;
    }
    closestCreep() {
        let minSqrDist = Infinity;
        let creep;
        Creep.instances.forEach((c) => {
            let sqrDist = BABYLON.Vector3.DistanceSquared(this.position, c.position);
            if (sqrDist < minSqrDist) {
                minSqrDist = sqrDist;
                creep = c;
            }
        });
        return creep;
    }
    update() {
        if (this._isLoaded) {
            let creep = this.closestCreep();
            if (creep) {
                if (this.aimAt(creep.position.add(new BABYLON.Vector3(0, 0.5, 0)))) {
                    this.shoot();
                }
            }
        }
    }
    shoot() {
        if (!this._reloading) {
            this._reloading = true;
            this._kFire = 0;
            this.getScene().registerBeforeRender(this.fireAnim);
            new Shell(this.canon.absolutePosition, this._barrelDir, 40, this.getScene());
        }
    }
    buildingType() {
        return BuildingType.Tower;
    }
}
Tower.FireDuration = 5;
Tower.CanonRestPosition = new BABYLON.Vector3(0, 0, 0);
Tower.FireCanonEndPosition = new BABYLON.Vector3(0, 0, -0.6);
class Wall extends Building {
    constructor(tile) {
        super("Wall", tile);
        this.hitpoint = 60;
    }
    load() {
        BABYLON.SceneLoader.ImportMesh("", "./data/wall.babylon", "", this.getScene(), (meshes, particleSystems, skeletons) => {
            meshes.forEach((m) => {
                if (m instanceof BABYLON.Mesh) {
                    if (m.name === "Body") {
                        this.body = m;
                        this.body.parent = this;
                    }
                }
            });
            if (!this.body) {
                return console.error("Failed to load some part of 'Wall'.");
            }
            this.body.parent = this;
        });
    }
    update() {
    }
    buildingType() {
        return BuildingType.Wall;
    }
}
class TileUserInterface {
    get game() {
        return this.userInterface.game;
    }
    get scene() {
        return this.game.scene;
    }
    get selectedTile() {
        return this._selectedTile;
    }
    set selectedTile(t) {
        if (this._selectedTile && this._selectedTile !== t) {
            this.unselect(this._selectedTile);
        }
        this._selectedTile = t;
        if (this._selectedTile) {
            this.select(this._selectedTile);
        }
    }
    get tileSelector() {
        if (!this._tileSelector) {
            this._tileSelector = BABYLON.MeshBuilder.CreateGround("TileSelector", { width: 2.5, height: 2.5 }, this.scene);
            let tileSelectorMaterial = new BABYLON.StandardMaterial("TileSelectorMaterial", this.scene);
            tileSelectorMaterial.diffuseColor.copyFromFloats(0, 1, 0);
            this._tileSelector.material = tileSelectorMaterial;
        }
        return this._tileSelector;
    }
    constructor(UserInterface) {
        this.userInterface = UserInterface;
    }
    showTileSelectorAt(x, z) {
        this.tileSelector.isVisible = true;
        this.tileSelector.position.x = x * 2.5;
        this.tileSelector.position.y = 0.1;
        this.tileSelector.position.z = z * 2.5;
    }
    hideTileSelector() {
        this.tileSelector.isVisible = false;
    }
    select(tile) {
        if (tile.selected) {
            this.reselect(tile);
        }
        else {
            tile.selected = true;
        }
        this.showTileSelectorAt(tile.x, tile.z);
    }
    reselect(tile) {
        this.closeEditionMenu();
        this.openEditionMenu();
        this.updateEditionMenu(tile);
    }
    unselect(tile) {
        tile.selected = false;
        this.closeEditionMenu();
        this.hideTileSelector();
    }
    openEditionMenu() {
        this.guiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("TileEditionMenu");
    }
    updateEditionMenu(tile) {
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
            this.createGatlingControl.onPointerUpObservable.add((eventData, eventState) => {
                this.game.BuildGatling(Player.human, tile.x, tile.z);
            });
            this.createTowerControl = BABYLON.GUI.Button.CreateSimpleButton("CreateTower", "Create Tower");
            this.createTowerControl.color = "#ffffff";
            this.createTowerControl.background = "#000000";
            this.createTowerControl.width = "100px";
            this.createTowerControl.height = "30px";
            this.createTowerControl.fontSize = "10px";
            this.stackControl.addControl(this.createTowerControl);
            this.createTowerControl.onPointerUpObservable.add((eventData, eventState) => {
                this.game.BuildTower(Player.human, tile.x, tile.z);
            });
            this.createWallControl = BABYLON.GUI.Button.CreateSimpleButton("CreateWall", "Create Wall");
            this.createWallControl.color = "#ffffff";
            this.createWallControl.background = "#000000";
            this.createWallControl.width = "100px";
            this.createWallControl.height = "30px";
            this.createWallControl.fontSize = "10px";
            this.stackControl.addControl(this.createWallControl);
            this.createWallControl.onPointerUpObservable.add((eventData, eventState) => {
                this.game.BuildWall(Player.human, tile.x, tile.z);
            });
        }
        this.stackControl.moveToVector3(new BABYLON.Vector3(tile.x * 2.5, 0, tile.z * 2.5), this.scene);
    }
    closeEditionMenu() {
        if (this.guiTexture) {
            this.guiTexture.dispose();
        }
    }
}
class UserInterface {
    constructor(game) {
        this.onClick = (eventData, eventState) => {
            if (eventData.type === BABYLON.PointerEventTypes._POINTERUP) {
                if (eventData.pickInfo.pickedPoint) {
                    let i = Math.round(eventData.pickInfo.pickedPoint.x / 2.5);
                    let j = Math.round(eventData.pickInfo.pickedPoint.z / 2.5);
                    let tile = this.game.terrain.tile(i, j);
                    this.tileUserInterface.selectedTile = tile;
                }
            }
        };
        this.game = game;
        this.tileUserInterface = new TileUserInterface(this);
        this.scene.onPointerObservable.add(this.onClick);
    }
    get scene() {
        return this.game.scene;
    }
}
