=head1 LICENSE

Copyright [1999-2015] Wellcome Trust Sanger Institute and the EMBL-European Bioinformatics Institute
Copyright [2016] EMBL-European Bioinformatics Institute

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

=cut

package EnsEMBL::Tools_hive::SiteDefs;

### tools_hive plugin is a backend for running the ensembl tools jobs (BLAST, BLAT, VEP etc) using ensembl-hive.
### With this plugin, the jobs that are submitted by the website (via the tools plugin) are saved in the
### ENSEMBL_WEB_HIVE db and another process called 'beekeeper' (that could possibly be running on a different
### machine) continually looks at that database, runs the newly submitted jobs on LSF farm or on
### the local machine (LOCAL) where this process itself is running.

use strict;

sub update_conf {

  $SiteDefs::ENSEMBL_HIVE_ERROR_MESSAGE         = '';                                               # Error message to be displayed in case code throws a HiveError exception (can be HTML)
  $SiteDefs::ENSEMBL_HIVE_DB_NOT_AVAILABLE      = 0;                                                # Flag if on, jobs will not get submitted to hive db (ENSEMBL_HIVE_ERROR_MESSAGE is displayed when submitting jobs)

  $SiteDefs::ENSEMBL_TOOLS_JOB_DISPATCHER       = { 
                                                    'Blast'             => 'Hive',
                                                    'VEP'               => 'Hive',
                                                    'AssemblyConverter' => 'Hive',
                                                    'IDMapper'          => 'Hive',
                                                    'FileChameleon'     => 'Hive',
                                                    'AlleleFrequency'   => 'Hive',
                                                    'VcftoPed'          => 'Hive',
                                                    'DataSlicer'        => 'Hive',
                                                    'VariationPattern'  => 'Hive',
                                                  };                                                # Overriding tools plugin variable
  $SiteDefs::ENSEMBL_HIVE_HOSTS                 = [];                                               # For LOCAL, the machine that runs the beekeeper unless it's same as the web server
                                                                                                    # For LSF, list of hosts corresponding to the queues for all jobs plus the machine where
                                                                                                    # beekeeper is running unless it's same as the web server
                                                                                                    # Leave it blank if code is located on a shared disk to share between the web server and the machine(s)
                                                                                                    # running beekeeper
  $SiteDefs::ENSEMBL_HIVE_HOSTS_CODE_LOCATION   = $SiteDefs::ENSEMBL_SERVERROOT;                    # path from where hive hosts can access ensembl code (same as web root for jobs running on local machine)
  $SiteDefs::ENSEMBL_TOOLS_PIPELINE_PACKAGE     = 'EnsEMBL::Web::PipeConfig::Tools_conf';           # package read by init_pipeline.pl script from hive to create the hive database
  $ENV{'EHIVE_ROOT_DIR'}                        = $SiteDefs::ENSEMBL_SERVERROOT.'/ensembl-hive/';   # location from there hive scripts on the web server (not the hive hosts) can access the hive API

  push @SiteDefs::ENSEMBL_LIB_DIRS, "$SiteDefs::ENSEMBL_SERVERROOT/ensembl-hive/modules";

  @SiteDefs::ENSEMBL_TOOLS_LIB_DIRS = qw(
    ensembl
    ensembl-hive
    ensembl-io
    ensembl-variation
    ensembl-funcgen
    ensembl-tools
    ensembl-webcode
    ensembl-vep
    public-plugins
    sanger-plugins
    VEP_plugins
  );

  $SiteDefs::ENSEMBL_TOOLS_PERL_BIN             = '/usr/bin/perl';                                  # Path to perl bin for machine running the job
  $SiteDefs::ENSEMBL_TOOLS_BIOPERL_DIR          = defer { $SiteDefs::BIOPERL_DIR };                 # Location of bioperl on the hive host machine

  # BLAST configs
  $SiteDefs::ENSEMBL_BLAST_RUN_LOCAL            = 1;                                                # Flag if on, will run blast jobs on LOCAL meadow
  $SiteDefs::ENSEMBL_BLAST_QUEUE                = 'blast';                                          # LSF or LOCAL queue for blast jobs
  $SiteDefs::ENSEMBL_BLAST_LSF_TIMEOUT          = undef;                                            # Max timelimit a blast job is allowed to run on LSF
  $SiteDefs::ENSEMBL_BLAST_ANALYSIS_CAPACITY    = 24;                                               # Number of jobs that can be run parallel in the blast queue (LSF or LOCAL)
  $SiteDefs::ENSEMBL_NCBIBLAST_BIN_PATH         = '/path/to/ncbi-blast/bin';                        # path to blast executables on the LSF host (or local machine if job running locally)
  $SiteDefs::ENSEMBL_NCBIBLAST_MATRIX           = '/path/to/ncbi-blast/data';                       # path to blast matrix files on the LSF host (or local machine if job running locally)
  $SiteDefs::ENSEMBL_NCBIBLAST_DATA_PATH        = "/path/to/genes";                                 # path for the blast index files (other than DNA) on the LSF host (or local machine if job running locally)
  $SiteDefs::ENSEMBL_NCBIBLAST_DATA_PATH_DNA    = "/path/to/blast/dna";                             # path for the blast DNA index files on the LSF host (or local machine if job running locally)
  $SiteDefs::ENSEMBL_REPEATMASK_BIN_PATH        = '/path/to/RepeatMasker';                          # path to RepeatMasker executable on the  LSF host (or local machine if job running locally)

  # BLAT configs
  $SiteDefs::ENSEMBL_BLAT_RUN_LOCAL             = 1;                                                # Flag if on, will run blat jobs on LOCAL meadow
  $SiteDefs::ENSEMBL_BLAT_QUEUE                 = 'toolsgeneral';                                   # LSF or LOCAL queue for blat jobs
  $SiteDefs::ENSEMBL_BLAT_LSF_TIMEOUT           = undef;                                            # Max timelimit a blat job is allowed to run on LSF
  $SiteDefs::ENSEMBL_BLAT_ANALYSIS_CAPACITY     = 4;                                                # Number of jobs that can be run parallel in the blat queue (LSF or LOCAL)
  $SiteDefs::ENSEMBL_BLAT_TWOBIT_DIR            = "/path/to/blat/twobit";                           # location where blat twobit files are located on LSF node (or local machine if job running locally)

  # VEP configs
  $SiteDefs::ENSEMBL_VEP_RUN_LOCAL              = 1;                                                # Flag if on, will run VEP jobs on LOCAL meadow
  $SiteDefs::ENSEMBL_VEP_QUEUE                  = 'VEP';                                            # LSF or LOCAL queue for VEP jobs
  $SiteDefs::ENSEMBL_VEP_LSF_TIMEOUT            = '3:00';                                           # Max timelimit a VEP job is allowed to run on LSF
  $SiteDefs::ENSEMBL_VEP_ANALYSIS_CAPACITY      = 24;                                               # Number of jobs that can be run parallel in the VEP queue (LSF or LOCAL)
  $SiteDefs::ENSEMBL_VEP_CACHE_DIR              = "/path/to/vep/cache";                             # path to vep cache files
  $SiteDefs::ENSEMBL_VEP_SCRIPT_DEFAULT_OPTIONS = {                                                 # Default options for command line vep script (keys with value undef get ignored)
    'host'        => undef,                                                                         # Database host (defaults to ensembldb.ensembl.org)
    'user'        => undef,                                                                         # Defaults to 'anonymous'
    'password'    => undef,                                                                         # Not used by default
    'port'        => undef,                                                                         # Defaults to 5306
    'fork'        => 4,                                                                             # Enable forking, using 4 forks
  };

  $SiteDefs::ENSEMBL_VEP_PLUGIN_DATA_DIR        = "/path/to/vep/plugin_data";                       # path to vep plugin data files on the LSF host (or local machine if job running locally)
  $SiteDefs::ENSEMBL_VEP_PLUGIN_DIR             = "VEP_plugins";                                    # path to vep plugin code (if does not start with '/', it's treated relative to ENSEMBL_HIVE_HOSTS_CODE_LOCATION)

  push @{$SiteDefs::ENSEMBL_VEP_PLUGIN_CONFIG_FILES}, $SiteDefs::ENSEMBL_SERVERROOT.'/public-plugins/tools_hive/conf/vep_plugins_hive_config.txt';
                                                                                                    # add extra hive specific configs required to run vep plugins

  # Path to ID History converter script
  $SiteDefs::IDMAPPER_SCRIPT                    = 'ensembl-tools/scripts/id_history_converter/IDmapper.pl';

  # Assembly Converter configs
  $SiteDefs::ENSEMBL_AC_RUN_LOCAL               = 1;                                                # Flag if on, will run AC jobs on LOCAL meadow
  $SiteDefs::ENSEMBL_AC_QUEUE                   = 'toolsgeneral';                                   # LSF or LOCAL queue for AC jobs
  $SiteDefs::ENSEMBL_AC_LSF_TIMEOUT             = undef;                                            # Max timelimit an AC job is allowed to run on LSF
  $SiteDefs::ENSEMBL_AC_ANALYSIS_CAPACITY       = 4;                                                # Number of jobs that can be run parallel in the queue (LSF or LOCAL)

  # ID History converter configs
  $SiteDefs::ENSEMBL_IDM_RUN_LOCAL              = 1;                                                # Flag if on, will run ID mapper jobs on LOCAL meadow
  $SiteDefs::ENSEMBL_IDM_QUEUE                  = 'toolsgeneral';                                   # LSF or LOCAL queue for ID mapper jobs
  $SiteDefs::ENSEMBL_IDM_LSF_TIMEOUT            = undef;                                            # Max timelimit an ID mapper job is allowed to run on LSF
  $SiteDefs::ENSEMBL_IDM_ANALYSIS_CAPACITY      = 4;                                                # Number of jobs that can be run parallel in the queue (LSF or LOCAL)

  # File Chameleon configs
  $SiteDefs::ENSEMBL_FC_RUN_LOCAL              = 1;
  $SiteDefs::ENSEMBL_FC_QUEUE                  = 'toolsgeneral';                                   
  $SiteDefs::ENSEMBL_FC_LSF_TIMEOUT            = undef;                                            
  $SiteDefs::ENSEMBL_FC_ANALYSIS_CAPACITY      = 4;                                                

  # Allele Frequency configs
  $SiteDefs::ENSEMBL_AF_RUN_LOCAL              = 1;
  $SiteDefs::ENSEMBL_AF_QUEUE                  = 'toolsgeneral';
  $SiteDefs::ENSEMBL_AF_ANALYSIS_CAPACITY      = 4;

  # VCF to PED configs
  $SiteDefs::ENSEMBL_VP_RUN_LOCAL              = 1;
  $SiteDefs::ENSEMBL_VP_QUEUE                  = 'toolsgeneral';
  $SiteDefs::ENSEMBL_VP_ANALYSIS_CAPACITY      = 4;

  # Data Slicer configs
  $SiteDefs::ENSEMBL_DS_RUN_LOCAL              = 1;
  $SiteDefs::ENSEMBL_DS_QUEUE                  = 'toolsgeneral';
  $SiteDefs::ENSEMBL_DS_ANALYSIS_CAPACITY      = 4;

  # Variation pattern finder configs
  $SiteDefs::ENSEMBL_VPF_RUN_LOCAL              = 1;
  $SiteDefs::ENSEMBL_VPF_QUEUE                  = 'toolsgeneral';
  $SiteDefs::ENSEMBL_VPF_ANALYSIS_CAPACITY      = 4;


}

1;
