#########################################################################
#  Win32::GUI Interface for OpenKore
#  by: amacc_boy (koreadvance@yahoo.com)
#
#########################################################################

package Interface::SimpleWin32;

use strict;
use warnings;
no warnings 'redefine';
use Time::HiRes qw(usleep);
use IO::Socket;
use bytes;
no encoding 'utf8';

use Modules 'register';
use Globals qw(%consoleColors);
use Interface;
use base qw(Interface);
use I18N qw(UTF8ToString);

our @input_que;
our @input_list;


sub new {
	my $class = shift;
	binmode STDOUT;
	STDOUT->autoflush(0);
	return bless {}, $class;
}

sub DESTROY {
	STDOUT->flush;
}

sub getInput {
	my ($self, $timeout) = @_;
	my $line;
	my $bits;

	if ($timeout < 0) {
		$line = <STDIN>;
	}

	if (defined $line) {
		$line =~ s/\n//;
		$line = undef if ($line eq '');
	}
	$line = I18N::UTF8ToString($line) if (defined($line));
	return $line;
}

sub writeOutput {
	my ($self, $type, $message, $domain) = @_;
	print STDOUT $message;
	STDOUT->flush;
}

sub title {
	my ($self, $title) = @_;
	if ($title) {
		if (!defined($self->{title}) || $self->{title} ne $title) {
			$self->{title} = $title;
			print STDOUT "{TITLE}" . $title;
			STDOUT->flush;
		}
	} else {
		return $self->{title};
	}
}
1;