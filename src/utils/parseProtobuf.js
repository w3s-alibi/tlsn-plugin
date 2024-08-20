const { inspect } = require('util');

const parseGoogleMapsUrlData = (protobufString) => {
  const parts = protobufString.split('!').filter(s => s.length > 0);
  const root = [];
  let curr = root;
  const mStack = [root];
  const mCount = [parts.length];

  for (const el of parts) {
    const kind = el[1];
    const value = el.slice(2);

    mCount.forEach((_, i) => mCount[i]--);

    if (kind === 'm') {
      const newArr = [];
      mCount.push(Number(value));
      curr.push(newArr);
      mStack.push(newArr);
      curr = newArr;
    } else {
      curr.push(
          kind === 'b' ? value === '1' :
              ['d', 'f'].includes(kind) ? parseFloat(value) :
                  ['i', 'u', 'e'].includes(kind) ? parseInt(value) :
                      value
      );
    }

    while (mCount.at(-1) === 0) {
      mStack.pop();
      mCount.pop();
      curr = mStack.at(-1);
    }
  }

  return root;
};

// const protobufString = process.argv[2];
// if (!protobufString) {
//   console.error('Please provide a protobuf string as an argument.');
//   process.exit(1);
// }

const protobufString = '!1m9!2m8!1m3!1i2021!2i6!3i2!2m3!1i2021!2i6!3i2!2m3!6b1!7b1!8b1!3m11!1m10!1e0!2m8!1m3!1i2021!2i4!3i4!2m3!1i2021!2i8!3i1!5m0!7m4!1s3U7EZsGjPIibi-gPvfKvyAw!3b1!7e94!15i12604'

const result = parseGoogleMapsUrlData(protobufString);
console.log(inspect(result, { depth: null }));