import assert from "assert";

export interface PaginatedResult<T> {
    data: T[];
    first: string | null;
    last: string | null;
    hasMore: boolean;
}

export function paginate<T extends Record<K, string>, K extends keyof T>(
    data: T[],
    cursorKey: K,
    cursor?: string,
    take: number = 5
): PaginatedResult<T> {
    const absTake = Math.abs(take);
    let sliceArr = take > 0
        ? [0, take]
        : [Math.max(data.length - absTake, 0), data.length];

    if(take === 0) throw new Error('take must not be 0');

    if (cursor) {
        const cursorIndex = data.findIndex(item => item[cursorKey] === cursor);
        sliceArr = take > 0
            ? [cursorIndex + 1, cursorIndex + 1 + absTake]
            : [Math.max(cursorIndex - absTake, 0), cursorIndex];
    }

    const [sliceStart, sliceEnd] = sliceArr;

    const paginatedData = data.slice(sliceStart, sliceEnd);

    return {
        data: paginatedData,
        first: sliceStart > 0 ? data[sliceStart - 1][cursorKey] : null,
        last: sliceEnd < data.length ? data[sliceEnd][cursorKey] : null,
        hasMore: sliceEnd < data.length
    };
}


// Test data setup
const testData = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }];

// Test: Check if the function returns the correct number of items for a positive take
assert(paginate(testData, 'id', undefined, 3).data.length === 3, 'Should return 3 items');

// Test: Check if the function returns the correct number of items from the end for a negative take
assert(paginate(testData, 'id', undefined, -2).data.length === 2, 'Should return 2 items from the end');

// Test: Validate the first and last elements in the paginated result
const result = paginate(testData, 'id', undefined, 2);
assert(result.first === null && result.last === testData[2].id, 'Incorrect first or last element');

// Test: Check cursor-based pagination
assert(paginate(testData, 'id', '2', 2).data[0].id === '3', 'Cursor not correctly setting start position');

// Test: Check if 'hasMore' flag is correctly calculated
assert(paginate(testData, 'id', undefined, 5).hasMore === false, 'hasMore should be false when all items are taken');

// Test: Ensure the function throws an error when 'take' is 0
try {
    paginate(testData, 'id', undefined, 0);
    assert(false, 'Should have thrown an error for take = 0');
} catch (error) {
    assert(true, 'Correctly throws error for take = 0');
}

// Boundary Tests: Check behavior at the start and end of the array
assert(paginate(testData, 'id', '1', 2).data.length === 2, 'Boundary check failed at start of array');
assert(paginate(testData, 'id', '5', -2).data.length === 2, 'Boundary check failed at end of array');

// Data Integrity Tests: Ensure the data returned matches expected values
const expectedDataForPositiveTake = testData.slice(0, 3);
const actualDataForPositiveTake = paginate(testData, 'id', undefined, 3).data;
assert(JSON.stringify(actualDataForPositiveTake) === JSON.stringify(expectedDataForPositiveTake), 'Data mismatch for positive take');

const expectedDataForNegativeTake = testData.slice(-2);
const actualDataForNegativeTake = paginate(testData, 'id', undefined, -2).data;
assert(JSON.stringify(actualDataForNegativeTake) === JSON.stringify(expectedDataForNegativeTake), 'Data mismatch for negative take');

const cursorIndex = testData.findIndex(item => item.id === '3');
const expectedDataWithCursor = testData.slice(cursorIndex + 1, cursorIndex + 3);
const actualDataWithCursor = paginate(testData, 'id', '3', 2).data;
assert(JSON.stringify(actualDataWithCursor) === JSON.stringify(expectedDataWithCursor), 'Data mismatch with cursor');
