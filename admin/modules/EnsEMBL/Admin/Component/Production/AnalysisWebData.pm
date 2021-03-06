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

package EnsEMBL::Admin::Component::Production::AnalysisWebData;

use strict;

use parent qw(EnsEMBL::Admin::Component::Production);

sub caption {
  return '';
}

sub content {
  my $self = shift;
  
  my $hub     = $self->hub;
  my $records = $self->object->rose_objects;

  my $content = $self->dom->create_element('div', {'class' => '_tabselector'});
  my $buttons = $content->append_child('div', {'class' => 'ts-buttons-wrap'});
  my $tabs    = $content->append_child('div', {'class' => 'spinner ts-spinner _ts_loading'});

  my $groups  = {};

  ## create a data structure of all the records
  foreach my $record (@$records) {
    foreach my $groupby (qw(web_data_id analysis_description_id species_id db_type)) {
      my $val = $record->$groupby;
      for (ref $val eq 'ARRAY' ? @$val : $val) {
        if (!$groups->{$groupby}{$_ || '0'}) {
          (my $method = $groupby) =~ s/_id$//;
          $groups->{$groupby}{$_ || '0'} = {'title' => $self->get_printable($record->$method)};
        }
        push @{$groups->{$groupby}{$_ || '0'}{'records'} ||= []}, $record;
      }
    }
  }

  ## Iterate through the data structure to print the list
  foreach my $key (sort keys %$groups) {

    my $group   = $groups->{$key};
    (my $method = $key) =~ s/_id$//;

    $buttons->append_child('a', {'class' => '_ts_button ts-button', 'href' => "#$method", 'inner_HTML' => join(' ', map {(ucfirst $_)} split '_', $method)});
    my $tab = $tabs->append_child('div', {'class' => '_ts_tab ts-tab prod-list'});
    my @bg  = qw(bg1 bg2);

    for (sort {$group->{$a}{'title'} cmp $group->{$b}{'title'}} keys %$group) {

      ## add to the list
      $tab->append_child('div', {
        'class'       => "prod-group $bg[0]",
        'inner_HTML'  => sprintf(
          '<span%s>%s</span> (<a href="%s">%d records</a>)',
          $method eq 'web_data' ? ' class="_datastructure"' : '',
          $group->{$_}{'title'},
          $hub->url({'action' => 'LogicName', $key => $_}),
          scalar @{$group->{$_}{'records'}}
        )
      });

      @bg = reverse @bg;
    }
    
    $tab->first_child->set_attribute('class', 'prod-group-first');
    $tab->last_child->set_attribute('class', 'prod-group-last');

  }

  return $content->render;
}

1;