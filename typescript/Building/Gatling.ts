class Gatling extends Building {

    private static BulletCount: number = 10;
    private static FireRate: number = 2;

    public rotationSpeed: number = Math.PI / 2;
    public cooldown: number = 90;
    public body: BABYLON.AbstractMesh;
    public canon: BABYLON.AbstractMesh;

    constructor(
        tile: Tile
    ) {
        super("Gatling", tile);
        this.hitpoint = 30;
    }

    public load(): void {
        BABYLON.SceneLoader.ImportMesh(
            "",
            "./data/gatling.babylon",
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
                            if (m.name === "Canon") {
                                this.canon = m;
                                this.canon.parent = this;
                            }
                        }
                    }
                );
                if (!this.body || !this.canon) {
                    return console.error("Failed to load some part of 'Gatling'.");
                }
                this.body.parent = this;
                this.canon.parent = this.body;
                this._isLoaded = true;
            }
        );
    }

    private _tmp: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _canonDir: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _canonRight: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private aimAt(position: BABYLON.Vector3): boolean {
        let deltaTime: number = this.getScene().getEngine().getDeltaTime() / 1000;
        this.canon.getDirectionToRef(BABYLON.Axis.Z, this._canonDir);
        this._canonDir.normalize();
        this.canon.getDirectionToRef(BABYLON.Axis.X, this._canonRight);
        this._canonRight.normalize();

        this._tmp.copyFrom(position);
        this._tmp.subtractInPlace(this.canon.getAbsolutePosition());
        this._tmp.normalize();
        let alpha: number = TDMath.AngleFromToAround(this._canonDir, this._tmp, BABYLON.Axis.Y);
        if (isFinite(alpha)) {
            let a: number = Math.min(Math.abs(alpha), deltaTime * this.rotationSpeed);
            this.canon.rotate(BABYLON.Axis.Y, BABYLON.Scalar.Sign(alpha) * a);

            if (Math.abs(alpha) < Math.PI / 8) {
                this._tmp.copyFrom(position);
                this._tmp.subtractInPlace(this.canon.getAbsolutePosition());
                this._tmp.normalize();
                let beta: number = TDMath.AngleFromToAround(this._canonDir, this._tmp, this._canonRight);
                if (isFinite(beta)) {
                    let b: number = Math.min(Math.abs(beta), deltaTime * this.rotationSpeed);
                    this.canon.rotate(BABYLON.Axis.X, BABYLON.Scalar.Sign(beta) * b, BABYLON.Space.LOCAL);
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
                    if (this.shoot(creep.position.add(new BABYLON.Vector3(0, 0.5, 0)))) {
                        creep.wound(1);
                    }
                }
            }
        }
    }

    private _reloading: boolean = false;
    public shoot(target: BABYLON.Vector3): boolean {
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
    
    private _tmpTargetDirection: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _targetPosition: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    private _kkFire: number = Infinity;
    private _kFire: number = 0;
    private _rays: BABYLON.RayHelper[] = [];
    public fireAnim = () => {
        this._kkFire++;
        if (this._kkFire > Gatling.FireRate) {
            this._tmpTargetDirection.copyFrom(this._targetPosition);
            this._tmpTargetDirection.x += (Math.random() - 0.5) * 1;
            this._tmpTargetDirection.y += (Math.random() - 0.5) * 1;
            this._tmpTargetDirection.z += (Math.random() - 0.5) * 1;
            this._tmpTargetDirection.subtractInPlace(this.canon.absolutePosition);
            this._tmpTargetDirection.normalize();
            this._rays.push(
                BABYLON.RayHelper.CreateAndShow(
                    new BABYLON.Ray(this.canon.absolutePosition.clone(), this._tmpTargetDirection.clone()),
                    this.scene,
                    BABYLON.Color3.Red()
                )
            );
            this._kkFire = 0;
            this._kFire++;
        }
        if (this._kFire >= Gatling.BulletCount) {
            this._kReload = 0;
            this._kkReload = Infinity;
            this.getScene().unregisterBeforeRender(this.fireAnim);
            this.getScene().registerBeforeRender(this.reloadAnim);
        }
    }

    private _kkReload: number = Infinity;
    private _kReload: number = 0;
    public reloadAnim = () => {
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
    }

    public buildingType(): BuildingType {
        return BuildingType.Gatling;
    }
}