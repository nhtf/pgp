import type { World } from "./world";
import { ballId, floorId, tableId, tableLength, tableHeight } from '../Components/vars';
import { Vector } from '../Systems/math';

let previousStep: number | undefined;
let previousHit: number = 0;
let currentHit: number = 0;
let playerIdHit: number = 0;

const stepDelay = 5;

function getPlayerSide(playerId: number): boolean {
    //function to check if the id of the player is for player 1 or player 2 using backend.

    if (playerId === 91397 || playerId === 42)
        return false;
    return true;
}

function getSideTable(vector: Vector): boolean {
    if (vector.x > -tableLength / 2 && vector.x <= 0)
        return false;
    return true;
}

//function which checks if where the ball lands is valid (i.e. a player hits the ball and then ball lands on floor would be invalid)
function checkBallCorrectLanding(currentHit: number, previousHit: number, playerIdHit: number, vector: Vector): number {
    // console.log(currentHit, previousHit, playerIdHit);
    if (playerIdHit === 0)
        return 0;
    else if (previousHit === 0 && currentHit > floorId) {
        console.log("first here");
        return 1;
    }
    else if (previousHit > floorId && currentHit === tableId) {
        if (vector.y > tableHeight)
            return 2;
        console.log("second here");
        if ((!getPlayerSide(previousHit) && !getSideTable(vector)) || (getPlayerSide(previousHit) && getSideTable(vector)))
            return 2;
    }
    else if (previousHit === tableId && currentHit === tableId) {
        if (vector.y > tableHeight)
            return 2;
        console.log("third here");
        if ((getPlayerSide(playerIdHit) && !getSideTable(vector)) || (!getPlayerSide(playerIdHit) && getSideTable(vector)))
            return 3;
    }
    else if (previousHit === tableId && currentHit > floorId) {//check if correct player here.
        console.log("fourth here");
        return 4;
    }
    return 0;
}

//Want to do this on backend probably
export function collisionHandler(world: World) {
    if (!world.getEntity("BALL")?.physicsObject.isActive())
        return;
    if (previousStep !== undefined) {
        const stepDelta = world.stepCount - previousStep;

        let dispatch = world.world.getDispatcher();
        const numManiFolds = dispatch.getNumManifolds();
        for (let i = 0; i < numManiFolds; i++) {
            let conctactManifold = dispatch.getManifoldByIndexInternal(i);
            let obA = conctactManifold.getBody0().getUserIndex();
            let obB = conctactManifold.getBody1().getUserIndex();
            if (obA !== ballId && obB !== ballId || stepDelta < stepDelay)
                continue;
            currentHit = obA === ballId ? obB : obA;
            if ((obA > floorId || obB > floorId) && playerIdHit === 0)
                playerIdHit = obA > floorId ? obA : obB;
            let numContacts = conctactManifold.getNumContacts();
            for (let j = 0; j < numContacts; j++) {
                let contactPoint = conctactManifold.getContactPoint(j);

                let tableHitLoc = Vector.moveFromAmmo(contactPoint.getPositionWorldOnA());
                let ballHit = checkBallCorrectLanding(currentHit, previousHit, playerIdHit, tableHitLoc);
                if (ballHit > 0) {
                    if (ballHit === 3)
                        playerIdHit = 0;
                    console.log("ball hit validly");
                    previousHit = currentHit;
                    previousStep += stepDelta;
                    return;
                }
                else {
                    playerIdHit = 0;
                    previousHit = 0;
                    currentHit = 0;
                    // console.log("ball hit invalidly");
                }
                if (obA !== floorId && obB !== floorId) {
                    previousStep += stepDelta;
                    return;
                }
            }
        }
    }
    else {
        previousStep = world.stepCount;
    }
}