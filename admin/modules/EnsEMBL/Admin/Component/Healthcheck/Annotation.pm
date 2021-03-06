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

package EnsEMBL::Admin::Component::Healthcheck::Annotation;

use strict;

use parent qw(EnsEMBL::Admin::Component::Healthcheck);

sub caption {
  return 'Annotation';
}

sub content {
  my $self = shift;
  
  my $object  = $self->object;
  my $hub     = $self->hub;
  my $reports = $object->rose_objects;
  my $referer = $hub->referer->{'uri'};
  my $user    = $hub->user;

  return '<p>No report found to annotate. (Missing report id)</p>' unless $reports && @$reports;

  my $heading       = 'Add annotation';
  my $label_done_by = 'Added by';
  my $comment       = {
    'text'        => '',
    'action'      => '',
    'created_by'  => '',
  };
  
  my $annotation;
  if (scalar @$reports == 1 && ($annotation = $reports->[0]->annotation)) {
    my $created_by_user       = $annotation->created_by_user;
    $comment->{'text'}        = $annotation->comment;
    $comment->{'action'}      = $annotation->action;
    $comment->{'created_by'}  = $created_by_user->name if $created_by_user;
    $heading                  = 'Edit annotation';
    $label_done_by            = 'Edited by';
  }

  my $html = sprintf('<h4>Report%s</h4><ul>', scalar @$reports > 1 ? 's' : '');
  my $rid  = []; #ArrayRef of report ids to be passed as POST param
  
  for (@$reports) {
    next unless $_->report_id;
    $html .= sprintf('<li><b>%s (%s)</b>: %s</li>', $_->database_name, $_->testcase, join (', ', split (/,\s?/, $_->text)));
    push @$rid, $_->report_id;
  }
  $html   .= '</ul>';
  
  my $form = $self->new_form({'id' => 'annotation', 'action' => $hub->url({'action' => 'AnnotationSave'})});
  
  $form->add_fieldset($heading);
  
  my $options = []; #options for action select box
  my @actions = $self->annotation_action('all');
  while (my ($val, $cap) = splice @actions, 0, 2) {
    push @$options, {'value' => $val, 'caption' => $cap};
  }

  $form->add_field([{
    'label'     => 'Action',
    'name'      => 'action',
    'value'     => $self->annotation_action($comment->{'action'})->{'value'},
    'type'      => 'DropDown',
    'select'    => 'select',
    'values'    => $options
  }, {
    'label'     => 'Comment',
    'type'      => 'Text',
    'name'      => 'comment',
    'value'     => $comment->{'text'}
  }]);

  $form->add_field({
    'label'     => 'Added by',
    'type'      => 'NoEdit',
    'name'      => 'added_by_name',
    'value'     => $comment->{'created_by'},
  }) if $comment->{'created_by'} ne '';

  $form->add_field({
    'label'     => $label_done_by,
    'type'      => 'NoEdit',
    'name'      => 'user_name',
    'value'     => $user->name,
  });

  $form->add_button({
    'type'      =>  'Submit',
    'value'     =>  'Save',
    'name'      =>  'submit'
  });

  $form->add_hidden([
    {'name' => 'rid',       'value' => join (',', @$rid)},
    {'name' => 'release',   'value' => $object->requested_release},
    {'name' => 'referrer',  'value' => $referer}
  ]);

  return $html.$form->render;
}

1;