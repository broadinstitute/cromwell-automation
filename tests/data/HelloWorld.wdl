version 1.0

import "Structs.wdl"

workflow HelloWorld {
    input {
        String docker_tag
        RuntimeAttr? runtime_override
    }

    call PrintHello {
        input:
            docker_tag = docker_tag,
            runtime_override = runtime_override
    }

    output {
        File output_file = PrintHello.output_file
    }
}

task PrintHello {
    input {
        String docker_tag
        RuntimeAttr? runtime_override
    }

    output {
        File output_file = "output.txt"
    }

    RuntimeAttr runtime_default = object {
        cpu: 1,
        memory: 4,
        disks: 10,
        bootDiskSizeGb: 10,
        preemptible: 1,
        maxRetries: 3
    }
    RuntimeAttr runtime_attr = select_first([runtime_override, runtime_default])

    runtime {
        docker: docker_tag
        cpu: select_first([runtime_attr.cpu, runtime_default.cpu])
        memory: select_first([runtime_attr.memory, runtime_default.memory]) + " GiB"
        disks: "local-disk " + select_first([runtime_attr.disks, runtime_default.disks]) + " SSD"
        bootDiskSizeGb: select_first([runtime_attr.bootDiskSizeGb, runtime_default.bootDiskSizeGb])
        preemptible: select_first([runtime_attr.preemptible, runtime_default.preemptible])
        maxRetries: select_first([runtime_attr.maxRetries, runtime_default.maxRetries])
    }

    command <<<
        set -euo pipefail
        echo "Hello world!" > output.txt
    >>>
}


