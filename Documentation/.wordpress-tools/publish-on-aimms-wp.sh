#!/bin/bash

# read the options
TEMP=`getopt -o a:p: --long user:,password: -n $0 -- "$@"`
eval set -- "$TEMP"

# extract options and their arguments into variables.
while true ; do
	case "$1" in
		-u|--user)
			USERNAME=$2 ; shift 2 ;;
		-p|--password)
			PASSWORD=$2 ; shift 2 ;;
		--) shift ; break ;;
		*) echo "Internal error!" ; exit 1 ;;
	esac
done

if [ -z "${USERNAME}" ] || [ -z "${PASSWORD}" ] ; then
	echo -e "Usage:\n\t$0 -u|--user <wp-user> -p|--password <password>\n"
	exit 1
fi

SCRIPT_HOME="$(dirname $0)"

#set -x

find ../tutorials/ -type f | while read -r ; do
	export TUTORIAL_FILE="${REPLY}"
	export Q="[\"']";
	export D="[0-9]"
	if grep -q "data-wp-post-id=$Q$D$D$D$D$Q" "${TUTORIAL_FILE}" ; then
		echo "Attempting to upload '${TUTORIAL_FILE}'..."; 
		"${SCRIPT_HOME}"/update-page-on-wp.php \
			--url http://www.aimms.com \
			--id "$(cat "${TUTORIAL_FILE}" | awk -F"\"|'" '/<meta[^>]*data-wp-post-id[^>]*>/{print $2}')" \
			--user "${USERNAME}" \
			--password "${PASSWORD}" \
			--title "`cat "${TUTORIAL_FILE}" | awk -F'<|>' '/<title>/{print $3}'`" \
			--content <(cat "${TUTORIAL_FILE}" |\
							awk '/<.body>/ {insideBody=0} insideBody {print} /<body>/ {insideBody=1}' |\
							grep -v 'wp-title' |\
							sed 's%/index.html%/%g' |\
							sed '/<!--.*-->/d' |\
							sed '/<!--/,/-->/d' |\
							awk '/<pre>/ {insidePre=1} !insidePre {printf "%s ",$0} insidePre {printf "%s\n",$0} /<.pre>/ {insidePre=0}' \
						) || echo "Failed to upload '${TUTORIAL_FILE}'!"
	fi
done
