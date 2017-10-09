#!/usr/bin/env bash

set -eux -o pipefail

function exit_with_error {
  set +x
  echo -e "\e[31m$1\e[0m"
  exit 1
}

function warn {
  set +x
  echo -e "\e[33m$1\e[0m"
  set -x
}

# Your paramters
MODEL_PATH=${1:-}
THEME_PATH=${2:-}
AIMMS_VERSION=${3:-4.43.0.241}
AIMMS_ARCH=${4:-64}

if [[ "$MODEL_PATH" == "" || "$THEME_PATH" == "" || "$AIMMS_VERSION" == "" || "$AIMMS_ARCH" == "" ]]; then
  exit_with_error 'Usage: ./build-aimms-pack.sh path-to-your-model path-to-your-theme aimms-version aimms-arch'
fi

AIMMS_PATH="$HOME/AppData/Local/AIMMS/IFA/Aimms/$AIMMS_VERSION-x$AIMMS_ARCH/Bin/aimms.exe"
if [[ ! -x "$AIMMS_PATH" ]]; then
  exit_with_error "Can not find AIMMS in $AIMMS_PATH"
fi

MODEL_PATH=$(realpath "$MODEL_PATH")
if [[ ! -d "$MODEL_PATH" ]]; then
  exit_with_error "Can not find your model folder: $MODEL_PATH"
fi
MODEL=$(basename "$MODEL_PATH")

if [[ ! -f "$MODEL_PATH/$MODEL.aimms" ]]; then
  exit_with_error "Can not find $MODEL_PATH/$MODEL.aimms\nMake sure your aimms file has the same name as your model folder"
fi

if [[ -d "$(realpath "$MODEL_PATH/MainProject/WebUI/resources")" ]]; then
  RESOURCES="MainProject/WebUI/resources"
elif [[ -d "$(realpath "$MODEL_PATH/WebUI/resources")" ]]; then
  RESOURCES="WebUI/resources"
else
  exit_with_error 'Could not find resources folder, nothing can be optimized'
fi

if [[ -d "$(realpath "$THEME_PATH")" ]]; then
  THEME_PATH=$(realpath "$THEME_PATH")
else
  exit_with_error "Can not found your theme folder: $THEME_PATH"
fi


if [[ -d "$MODEL_PATH/$RESOURCES/javascript/chat-widget" ]]; then
  warn 'I noticed you have chat-widget. Are you really using it? Please make sure to delete all unused widgets to get better performance'
fi

# Install Google Compiler
if ls closure-compiler-*.jar | sort -nr | head -n1; then
  COMPILER=$(ls closure-compiler-*.jar | sort -nr | head -n1)
else
  curl -sSL https://dl.google.com/closure-compiler/compiler-latest.zip -o compiler.zip
  unzip -o compiler.zip
  COMPILER=$(ls closure-compiler-*.jar | sort -nr | head -n1)
fi

# Copy your project
rm -rf tmp "${MODEL}.aimmspack" || exit_with_error 'Make sure to exit AIMMS before running this script'
cp -r "$MODEL_PATH" tmp || exit_with_error 'Make sure to exit AIMMS before running this script'

mkdir tmp/resources-new

# Backup your images
if [[ -d "tmp/$RESOURCES/images" ]]; then
  cp -r "tmp/$RESOURCES/images" tmp/resources-new/images
elif [[ -d "tmp/$RESOURCES/image" ]]; then
  cp -r "tmp/$RESOURCES/image" tmp/resources-new/image
fi

# Backup your experimental-features
if [[ -f "tmp/$RESOURCES/experimental-features.conf" ]]; then
  cp "tmp/$RESOURCES/experimental-features.conf" "tmp/resources-new"
fi

# Back your theme images
while IFS= read -r -d '' FILE; do
  DIR_NAME=$(dirname "$FILE")
  if [[ "$DIR_NAME" != '.' ]]; then
    mkdir -p "tmp/resources-new/$DIR_NAME"
  else
    DIR_NAME=''
  fi
  cp "$THEME_PATH/$FILE" "tmp/resources-new/$DIR_NAME"
done <  <(find "$THEME_PATH" -type f -name '*.css' -exec grep -ohPir 'url\([^)]+\)' {} \; | sed -e 's/^url("*//g; s/"*)//g; s/'\''//g' | tr '\n' '\0')

# Combine your JS, CSS & Translation
if ! java -jar $COMPILER --js_output_file=tmp/resources-new/code.min.js --js tmp/$RESOURCES/**.js --js !tmp/$RESOURCES/**test*.js; then
  exit_with_error 'Make sure to remove all test folders in your javascript widgets. Like theme-switch-addon/test'
fi
find "tmp/$RESOURCES" -name '*.css' -exec cat {} \; > tmp/resources-new/style.min.css
find "tmp/$RESOURCES" -name '*.properties' -exec cat {} \; > tmp/resources-new/language.properties

# Cleanup you reserouces folder & copy generated files
rm -rf tmp/$RESOURCES
mv tmp/resources-new tmp/$RESOURCES

# Create an aimmspack from the tmp folder
"$AIMMS_PATH" "tmp\\${MODEL}.aimms" --export-to "..\\${MODEL}.aimmspack"
echo -e "\e[35mIt sounds you succesfully got your aimmspack.\nMake sure to first test your model by opening the tmp folder, then upload it to PRO\e[0m"