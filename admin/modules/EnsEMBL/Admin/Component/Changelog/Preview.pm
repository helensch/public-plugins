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

package EnsEMBL::Admin::Component::Changelog::Preview;

## Preview page to add some validation on the content field before displaying the saving the declaration.
## TODO - add this validation and sanitisation to EnsEMBL::ORM::Component::DbFrontend::Input for html type elements and then remove this file

use strict;
use warnings;

use EnsEMBL::Web::Exceptions;

use parent qw(EnsEMBL::ORM::Component::DbFrontend::Input);

sub content_tree {
  my $self          = shift;
  my $url_params    = $self->get_url_params;
  my $declaration   = $url_params->{'content'};
  my ($div, $error);

  try {
    $div = $self->dom->create_element('div', {'inner_HTML' => [$declaration, 1]});
  } catch {
    $error = sprintf '<p>You seem to have entered invalid xHTML. There was an error while parsing it: %s</p><p>Please try again.</p>', $_->message;
  };

  return $self->error_content_tree($error) if $error;

  sanitise_html_node($div);

  $url_params->{'content'} = $div->inner_HTML;

  return $self->SUPER::content_tree($url_params);
}

sub sanitise_html_node {
  my $node = shift;

  return unless $node->node_type eq $node->ELEMENT_NODE; # ignore text nodes

  $_ =~ /^(alt|cell(padding|spacing)|class|(col|row)span|href|src|rel|title)$/ or $node->remove_attribute($_) for @{$node->attributes};

  foreach my $child (@{$node->child_nodes}) {

    # remove any extra line break (converted to empty <p> tag by tinymce)
    $child->remove if $child->node_name eq 'p' && ($child->inner_HTML =~ /^[\s\n\r\t]*$/ || $child->inner_HTML eq '&nbsp;');
    
    # remove any empty text node
    $child->remove if !$child->node_name && $child->text =~ /^[\s\n\r\t]*$/;

    # sanitise the child node
    sanitise_html_node($child);
  }
}

1;