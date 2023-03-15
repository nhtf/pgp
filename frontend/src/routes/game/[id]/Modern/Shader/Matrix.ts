// export let m3 = 
export class m3{
    private _matrix: number[];
    constructor() {
        //Identity Matrix
        this._matrix = [
                1,0,0,
                0,1,0,
                0,0,1
            ];
    }


    translation(tx: number, ty: number) {
        const mata = [
            1, 0, 0,
            0, 1, 0,
            tx, ty, 1,
          ];
        this._matrix =  this.multiply(mata, this.matrix);
    }

    rotationXAxis(angleInRadians: number) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
      const mata = [
        1,0, 0,
        0, c, -s,
        0, s, c,
      ];
      this._matrix = this.multiply(mata, this.matrix);
    }

    rotationYAxis(angleInRadians: number) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
      const mata = [
        c, 0, s,
        0, 1, 0,
        -s, 0, c,
      ];
      this._matrix = this.multiply(mata, this.matrix);
    }
   
    rotation(angleInRadians: number) {
      var c = Math.cos(angleInRadians);
      var s = Math.sin(angleInRadians);
      const mata = [
        c,-s, 0,
        s, c, 0,
        0, 0, 1,
      ];
      this._matrix = this.multiply(mata, this.matrix);
    }
   
    scaling(sx: number, sy: number) {
      const mata = [
        sx, 0, 0,
        0, sy, 0,
        0, 0, 1,
      ];

      this._matrix = this.multiply(mata, this.matrix);
    }

    multiply(a: number[], b: number[]) {
        var a00 = a[0 * 3 + 0];
        var a01 = a[0 * 3 + 1];
        var a02 = a[0 * 3 + 2];
        var a10 = a[1 * 3 + 0];
        var a11 = a[1 * 3 + 1];
        var a12 = a[1 * 3 + 2];
        var a20 = a[2 * 3 + 0];
        var a21 = a[2 * 3 + 1];
        var a22 = a[2 * 3 + 2];
        var b00 = b[0 * 3 + 0];
        var b01 = b[0 * 3 + 1];
        var b02 = b[0 * 3 + 2];
        var b10 = b[1 * 3 + 0];
        var b11 = b[1 * 3 + 1];
        var b12 = b[1 * 3 + 2];
        var b20 = b[2 * 3 + 0];
        var b21 = b[2 * 3 + 1];
        var b22 = b[2 * 3 + 2];
     
        return [
          b00 * a00 + b01 * a10 + b02 * a20,
          b00 * a01 + b01 * a11 + b02 * a21,
          b00 * a02 + b01 * a12 + b02 * a22,
          b10 * a00 + b11 * a10 + b12 * a20,
          b10 * a01 + b11 * a11 + b12 * a21,
          b10 * a02 + b11 * a12 + b12 * a22,
          b20 * a00 + b21 * a10 + b22 * a20,
          b20 * a01 + b21 * a11 + b22 * a21,
          b20 * a02 + b21 * a12 + b22 * a22,
        ];
      }

      get matrix() {
        return this._matrix;
      }
  };

export const mat3Identity = [
    1,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    1
];