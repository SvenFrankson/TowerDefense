class Tower extends Building {

    private static FireDuration: number = 5;
    private static CanonRestPosition: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, 0);
    private static FireCanonEndPosition: BABYLON.Vector3 = new BABYLON.Vector3(0, 0, -0.6);

    public rotationSpeed: number = Math.PI / 2;
    public cooldown: number = 180;
    public body: BABYLON.AbstractMesh;
    public head: BABYLON.AbstractMesh;
    public barrel: BABYLON.AbstractMesh;
    public canon: BABYLON.AbstractMesh;

    constructor(
        tile: Tile
    ) {
        super("Tower", tile);
        this.hitpoint = 30;
    }

    public load(): void {
        BABYLON.SceneLoader.ImportMesh(
            "",
            "./data/tower.babylon",
            "",
            this.getScene(),
            (
                meshes, particleSystems, skeletons
            ) => {
                meshes.forEach(
                    (m: BABYLON.AbstractMesh) => {
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
                    }
                );
                if (!this.body || !this.head || !this.barrel || !this.canon) {
                    return console.error("Failed to load some part of 'Tower'.");
                }
                this.body.parent = this;
                this.head.parent = this.body;
                this.barrel.parent = this.head;
                this.canon.parent = this.barrel;
                this._isLoaded = true;
            }
        );
    }

    private _tmp: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _headDir: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _barrelDir: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _barrelRight: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private aimAt(position: BABYLON.Vector3): boolean {
        let deltaTime: number = this.getScene().getEngine().getDeltaTime() / 1000;
        this.head.getDirectionToRef(BABYLON.Axis.Z, this._headDir);
        this._headDir.normalize();
        this.barrel.getDirectionToRef(BABYLON.Axis.Z, this._barrelDir);
        this.barrel.getDirectionToRef(BABYLON.Axis.X, this._barrelRight);
        this._barrelDir.normalize();
        this._barrelRight.normalize();

        this._tmp.copyFrom(position);
        this._tmp.subtractInPlace(this.head.getAbsolutePosition());
        this._tmp.normalize();
        let alpha: number = TDMath.AngleFromToAround(this._headDir, this._tmp, BABYLON.Axis.Y);
        if (isFinite(alpha)) {
            let a: number = Math.min(Math.abs(alpha), deltaTime * this.rotationSpeed);
            this.head.rotate(BABYLON.Axis.Y, BABYLON.Scalar.Sign(alpha) * a);

            if (Math.abs(alpha) < Math.PI / 8) {
                this._tmp.copyFrom(position);
                this._tmp.subtractInPlace(this.barrel.getAbsolutePosition());
                this._tmp.normalize();
                let beta: number = TDMath.AngleFromToAround(this._barrelDir, this._tmp, this._barrelRight);
                if (isFinite(beta)) {
                    let b: number = Math.min(Math.abs(beta), deltaTime * this.rotationSpeed);
                    this.barrel.rotate(BABYLON.Axis.X, BABYLON.Scalar.Sign(beta) * b, BABYLON.Space.LOCAL);
                    return Math.abs(alpha) < Math.PI / 32 && Math.abs(beta) < Math.PI / 32;
                }
            }
        }

        return false;
    }

    private closestCreep(): Creep {
        let minSqrDist: number = Infinity;
        let creep: Creep;
        Creep.instances.forEach(
            (c: Creep) => {
                let sqrDist: number = BABYLON.Vector3.DistanceSquared(this.position, c.position);
                if (sqrDist < minSqrDist) {
                    minSqrDist = sqrDist;
                    creep = c;
                }
            }
        );
        return creep;
    }

    public update(): void {
        if (this._isLoaded) {
            let creep: Creep = this.closestCreep();
            if (creep) {
                if (this.aimAt(creep.position.add(new BABYLON.Vector3(0, 0.5, 0)))) {
                    this.shoot();
                }
            }
        }
    }

    private _reloading: boolean = false;
    public shoot(): void {
        if (!this._reloading) {
            this._reloading = true;
            this._kFire = 0;
            this.getScene().registerBeforeRender(this.fireAnim);
            new Shell(this.canon.absolutePosition, this._barrelDir, 40, this.getScene());
        }
    }
    
    private _kFire: number = 0;
    public fireAnim = () => {
        BABYLON.Vector3.LerpToRef(Tower.CanonRestPosition, Tower.FireCanonEndPosition, this._kFire++ / Tower.FireDuration, this.canon.position);
        if (this._kFire >= Tower.FireDuration) {
            this._kReload = 0;
            this.getScene().unregisterBeforeRender(this.fireAnim);
            this.getScene().registerBeforeRender(this.reloadAnim);
        }
    }

    private _kReload: number = 0;
    public reloadAnim = () => {
        BABYLON.Vector3.LerpToRef(Tower.FireCanonEndPosition, Tower.CanonRestPosition, this._kReload++ / this.cooldown, this.canon.position);
        if (this._kReload >= this.cooldown) {
            this.getScene().unregisterBeforeRender(this.reloadAnim);
            this._reloading = false;
        }
    }

    public buildingType(): BuildingType {
        return BuildingType.Tower;
    }
}