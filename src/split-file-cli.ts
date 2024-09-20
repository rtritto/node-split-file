#!/usr/bin/env node
import { mergeFiles, splitFile, splitFileBySize } from './split-file'

/** Parse cli option */
const parse = (option: string) => {
  switch (option) {
    case '-m':
      return _merge
      break
    case '-s':
      return _split
      break
    case '-x':
      return _splitFileBySize
    default:
      return _help
  }
}

/** Print the legend */
const _help = () => {
  console.log('Usage: split-file -s input.bin 5')
  console.log('       split-file -x input.bin 457000')
  console.log('       split-file -m output.bin part1 part2 ...')
  console.log('')
  console.log(' -s <input> <num_parts>')
  console.log('    Split the input file in the number of parts given.')
  console.log('')
  console.log(' -x <input> <max_size>')
  console.log('    Split the input file into multiple parts with file size maximum of max_size bytes')
  console.log('')
  console.log(' -m <output> <part> <part> ...')
  console.log('    Merge the given parts into the output file.')
  console.log('')
  console.log('')
  console.log('NPM Module "split - file" by Tom Valk.')
  console.log('Visit https://github.com/rtritto/node-split-file for info and help.')
}

/** Split command */
const _split = () => {
  const file = process.argv[3]
  const parts = Number.parseInt(process.argv[4], 10)

  if (isNaN(parts)) {
    return _help()
  }

  splitFile(file, parts).then((names) => {
    console.log('Successfully splitted into: ' + names)
  }).catch(function (err) {
    console.log('An error occured:')
    console.log(err)
  })
}

const _splitFileBySize = () => {
  const file = process.argv[3]
  const max_size = parseInt(process.argv[4])
  if (isNaN(max_size)) {
    return _help()
  }
  splitFileBySize(file, max_size).then((names) => {
    console.log('Successfully splitted into: ' + names)
  }).catch(function (err) {
    console.log('An error occured:')
    console.log(err)
  })
}
/** Merge command */
const _merge = () => {
  const files = []
  const output_file = process.argv[3]

  for (let i = 4, len = process.argv.length; i < len; i++) {
    files.push(process.argv[i])
  }

  mergeFiles(files, output_file).then(() => {
    console.log('Succesfully merged the parts into ' + output_file)
  }).catch((err) => {
    console.log('An error occured:')
    console.log(err)
  })
}

if (require.main === module) {
  const method = parse(process.argv[2])
  method()
}
