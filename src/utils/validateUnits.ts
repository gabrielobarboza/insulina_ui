import { Table } from "@/interfaces";

interface ValidateUnitsInput {
    (curr: number, table: Table) : Promise<number>
}

export const validateUnits: ValidateUnitsInput = async (curr, { initial, values  = []}) => {
    let result:number = 0
    const val = values[0]
    if(values.length > 1) {
        await values?.forEach((val, idx) => {
            if(curr >= val) result = initial + idx
        })
    } else if (val && curr >= val) {
        result = await Math.floor(initial + ((curr - val)/val))
    }
    
    return result
}

export default validateUnits