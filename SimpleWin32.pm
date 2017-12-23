#########################################################################
#  SimpleWin32 Interface for OpenKore
#  by: ren alcantara
#
#########################################################################

package Interface::SimpleWin32;

use strict;
use Interface;
use base qw/Interface/;
use Time::HiRes qw/time usleep/;
use Settings qw(%sys);
use Plugins;
use Globals;
use Settings;
use Misc;

our $last_domain = "";

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
	my $line ;
	my $fh;

	if($timeout < 0 ){
		$line = <STDIN>;
	}else{ 
		$line = <STDIN>;
	}
	

	if (defined $line) {
		$line =~ s/[\r\n]+$//;
		$line = undef if ($line eq '');
	}

	if( defined $line ){
		print STDOUT "green~console~".$line;
		STDOUT->flush;
	}

	$line = I18N::UTF8ToString($line) if (defined($line));
	return $line;
}

sub writeOutput {
	my ($self, $type, $message, $domain) = @_;
	my ($color);
	$color = $consoleColors{$type}{$domain} if (defined $type && defined $domain && defined $consoleColors{$type});
	$color = $consoleColors{$type}{'default'} if (!defined $color && defined $type);
	print STDOUT $color."~". $domain. "~" .$message;
	$last_domain = $domain;
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