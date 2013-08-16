package EnsEMBL::Web::Record;

### Wrapper around ORM::EnsEMBL::DB::Accounts::Object::Record for use in the web code

### For backward compatibility
### This packages replaces EnsEMBL::Web::Data::Record temporarily for object type UserData, untill UserData is properly re-written to make methods calls to actual Rose Record object instead of using hash keys
### Objects belonging to this class is only returned by EnsEMBL::Web::User::get_record or get_user_record(s) methods

use strict;
use warnings;

use EnsEMBL::Web::Tools::MethodMaker qw(add_method);

use base qw(EnsEMBL::Web::Root);

sub new {
  ## @constructor
  ## Creates new web record object and dynamically adds all the method to it as present rose record object
  my ($class, $object) = @_;
  foreach my $key (keys %$object) {
    add_method($class, $key, sub { return shift->{$key}; }) unless $class->can($key) && $key =~ /^_/;
  }
  return bless $object, $class;
}

sub from_rose_objects {
  ## @constructor
  ## Wraps rose record objects in web record objects
  ## @param ArrayRef of rose record objects
  ## @return List of Web::Record objects (one object for each rose object in the argument arrayref)
  my ($class, $rose_objects) = @_;

  my @keys = @$rose_objects ? map { $_->alias || $_->name } $rose_objects->[0]->meta->virtual_columns : ();

  return map {
    my $rose_object = $_;
    my $record      = $_->as_tree;
    $record->{$_}   = $rose_object->$_ for @keys;

    $record->{'__rose_object'} = $_;
    delete $record->{'data'};

    $class->new($record);
  } @$rose_objects;
}

sub id {
  return shift->{'record_id'};
}

sub colour { # some calls are made to this method while it's key may not be added to the object
  return shift->{'colour'};
}

sub label { # if this record is a das record, the webcode expects it to have this method
  return shift->data->{'label'};
}

sub clone {
  my $self        = shift;
  my $class       = ref $self;
  my $rose_object = delete $self->{'__rose_object'};
  my $clone       = $self->deepcopy($self);
  $self->{'__rose_object'} = $rose_object;
  $clone->{'__rose_object'} = $rose_object->clone_and_reset;
  $clone->{'__rose_object'}->cloned_from($self->id);
  $clone->{'cloned_from'} = $self->id;
  return $class->new($clone);
}

sub owner {
  my ($self, $owner)  = @_;
  my $rose_object     = $self->{'__rose_object'};
  $rose_object->record_type($owner->RECORD_TYPE);
  $rose_object->record_type_id($owner->get_primary_key_value);
  return $rose_object->record_type eq 'group' ? $rose_object->group : $rose_object->user;
}

sub save {
  ## Saves the record to db
  ## @param As accepted by ORM::EnsEMBL::DB::Accounts::Object::Record->save method (except that user argument can be EnsEMBL::Web::User instead of ORM::EnsEMBL::DB::Accounts::Object::User)
  my ($self, %params) = @_;
  $params{'user'} = $params{'user'}->rose_object if $params{'user'} && $params{'user'}->isa('EnsEMBL::Web::User');
  $self->{'__rose_object'}->save(%params);
}

sub delete {
  ## Deletes the record from the db
  shift->{'__rose_object'}->delete(@_);
}

sub cloned_from {
  return shift->{'cloned_from'};
}

sub data {
  shift->{'__rose_object'}->data(@_);
}

1;
