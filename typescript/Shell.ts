class Shell extends BABYLON.Mesh {

    public direction: BABYLON.Vector3;
    public speed: number;

    constructor(position: BABYLON.Vector3, direction: BABYLON.Vector3, speed: number, scene: BABYLON.Scene) {
        super("Shell", scene);
        let sphere: BABYLON.Mesh = BABYLON.MeshBuilder.CreateSphere("Sphere", {diameter: 0.3}, scene);
        sphere.parent = this;
        this.position.copyFrom(position);
        this.direction = direction.clone();
        this.speed = speed;
        scene.registerBeforeRender(this.update);
    }

    public explode(): void {
        let children: BABYLON.Node[] = this.getChildren();
        children.forEach(
            (n: BABYLON.Node) => {
                if (n instanceof BABYLON.AbstractMesh) {
                    n.dispose();
                }
            }
        )
        this.getScene().unregisterBeforeRender(this.update);
    }

    private _moveDir: BABYLON.Vector3 = BABYLON.Vector3.Zero();
    public update = () => {
        let deltaTime: number = this.getScene().getEngine().getDeltaTime() / 1000;
        this._moveDir.copyFrom(this.direction);
        this._moveDir.scaleInPlace(this.speed * deltaTime);
        this.position.addInPlace(this._moveDir);
        let c: Creep = this.intersectsCreep();
        if (c) {
            console.log("Creep Hit !");
            this.explode();
            c.wound(1);
        }
        if (this.position.y < 0) {
            this.explode();
        }
    }

    public intersectsCreep(): Creep {
        for (let i: number = 0; i < Creep.instances.length; i++) {
            let c: Creep = Creep.instances[i];
            if (BABYLON.Vector3.DistanceSquared(this.position, c.position.add(new BABYLON.Vector3(0, 0.5, 0))) < c.size * c.size) {
                return c;
            }
        }
        return undefined;
    }
}