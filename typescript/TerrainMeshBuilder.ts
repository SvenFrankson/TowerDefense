class TerrainMeshBuilder {
    
    public static clampedValueAtIJ(i: number, j: number, grid: number[][]): number {
        i = Math.min(grid.length - 1, Math.max(i, 0));
        if (grid[i]) {
            j = Math.min(grid[i].length - 1, Math.max(j, 0));
            return grid[i][j];
        }
        return NaN;
    }

    public static uvsForABCD(a: number, b: number, c: number, d: number): number[] {
        let s: string = "" + a + b + c + d;
        if (s === "0000") { // 1
            return [
                1/3, 2/3,
                1/3, 1,
                2/3, 1,
                2/3, 2/3
            ];
        }
        if (s === "0001") { // 2
            return [
                2/3, 2/3,
                2/3, 1,
                1, 1,
                1, 2/3
            ];
        }
        if (s === "0010") {
            return [
                2/3, 1,
                1, 1,
                1, 2/3,
                2/3, 2/3
            ];
        }
        if (s === "0011") {
            return [
                2/3, 2/3,
                2/3, 1/3,
                1/3, 1/3,
                1/3, 2/3
            ];
        }
        if (s === "0100") {
            return [
                1, 1,
                1, 2/3,
                2/3, 2/3,
                2/3, 1
            ];
        }
        if (s === "0101") { // 5
            return [
                2/3, 1/3,
                2/3, 2/3,
                1, 2/3,
                1, 1/3
            ];
        }
        if (s === "0110") {
            return [
                2/3, 1/3,
                1/3, 1/3,
                1/3, 2/3,
                2/3, 2/3
            ];
        }
        if (s === "0111") {
            return [
                1/3, 1/3,
                0, 1/3,
                0, 2/3,
                1/3, 2/3
            ];
        }
        if (s === "1000") {
            return [
                1, 2/3,
                2/3, 2/3,
                2/3, 1,
                1, 1,
            ];
        }
        if (s === "1001") {
            return [
                1/3, 2/3,
                2/3, 2/3,
                2/3, 1/3,
                1/3, 1/3
            ];
        }
        if (s === "1010") {
            return [
                1, 1/3,
                2/3, 1/3,
                2/3, 2/3,
                1, 2/3
            ];
        }
        if (s === "1011") {
            return [
                1/3, 2/3,
                1/3, 1/3,
                0, 1/3,
                0, 2/3
            ];
        }
        if (s === "1100") { // 4
            return [
                1/3, 1/3,
                1/3, 2/3,
                2/3, 2/3,
                2/3, 1/3
            ];
        }
        if (s === "1101") {
            return [
                0, 2/3,
                1/3, 2/3,
                1/3, 1/3,
                0, 1/3
            ];
        }
        if (s === "1110") { // 3
            return [
                0, 1/3,
                0, 2/3,
                1/3, 2/3,
                1/3, 1/3
            ];
        }
        if (s === "1111") { // 0
            return [
                0, 2/3,
                0, 1,
                1/3, 1,
                1/3, 2/3
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

    public static buildForGrid(grid: number[][]): BABYLON.VertexData {
        let width: number = grid.length;
        let length: number = grid[0].length;
        let data: BABYLON.VertexData = new BABYLON.VertexData();

        let positions: number[] = [];
        let indices: number[] = [];
        let uvs: number[] = [];

        for (let i: number = -1; i < width; i++) {
            for (let j: number = -1; j < length; j++) {
                let a: number = TerrainMeshBuilder.clampedValueAtIJ(i, j + 1, grid);
                let b: number = TerrainMeshBuilder.clampedValueAtIJ(i + 1, j + 1, grid);
                let c: number = TerrainMeshBuilder.clampedValueAtIJ(i + 1, j, grid);
                let d: number = TerrainMeshBuilder.clampedValueAtIJ(i, j, grid);

                let index: number = positions.length / 3;
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