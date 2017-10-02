class TDMath {

    public static IsNanOrZero(n: number): boolean {
        return isNaN(n) || n === 0;
    }

    public static ProjectPerpendicularAtToRef(v: BABYLON.Vector3, at: BABYLON.Vector3, ref: BABYLON.Vector3): void {
        if (v && at) {
            let k: number = BABYLON.Vector3.Dot(v, at);
            k = k / at.lengthSquared();
            if (isFinite(k)) {
                ref.copyFrom(v);
                ref.subtractInPlace(at.scale(k));
            }
        }
    }

    public static ProjectPerpendicularAt(v: BABYLON.Vector3, at: BABYLON.Vector3): BABYLON.Vector3 {
        let out: BABYLON.Vector3 = BABYLON.Vector3.Zero();
        TDMath.ProjectPerpendicularAtToRef(v, at, out);
        return out;
    }

    public static Angle(from: BABYLON.Vector3, to: BABYLON.Vector3): number {
        return Math.acos(BABYLON.Vector3.Dot(from, to) / from.length() / to.length());
    }

    public static AngleFromToAround(
        from: BABYLON.Vector3, to: BABYLON.Vector3, around: BABYLON.Vector3, onlyPositive: boolean = false
    ): number {
        let pFrom: BABYLON.Vector3 = TDMath.ProjectPerpendicularAt(from, around).normalize();
        if (TDMath.IsNanOrZero(pFrom.lengthSquared())) {
            return NaN;
        }
        let pTo: BABYLON.Vector3 = TDMath.ProjectPerpendicularAt(to, around).normalize();
        if (TDMath.IsNanOrZero(pTo.lengthSquared())) {
            return NaN;
        }
        let angle: number = Math.acos(BABYLON.Vector3.Dot(pFrom, pTo));
        if (BABYLON.Vector3.Dot(BABYLON.Vector3.Cross(pFrom, pTo), around) < 0) {
            if (onlyPositive) {
                angle = 2 * Math.PI - angle;
            } else {
                angle = -angle;
            }
        }
        return angle;
    }
}
